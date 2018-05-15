"use strict"

const crypto = require('crypto');
const challengeAPI = require("./challenges.js")
const fs = require("fs")

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = {
    UserHandler: UserHandler
};

function UserHandler(database) {
    return (function() {

        var db = database;
        var challengeHandler = challengeAPI.ChallengesHandler(db);

        function User(username, email, id) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.image = {};
            this.cookie = "";
        };

        function generateSalt() {
            return new Promise(function(resolve, reject) {
                crypto.randomBytes(64, function(err, buffer) {
                    if (err) {
                        reject(err);
                    }

                    resolve(buffer.toString('hex'));
                });
            });
        };

        function sha512(password, salt) {
            var hash = crypto.createHmac('sha512', salt);
            hash.update(password);
            var hashedPassword = String(hash.digest('hex'));
            return hashedPassword;
        };

        function saltHashPassword(password) {
            return new Promise(function(resolve, reject) {

                generateSalt().then(function(salt) {
                    resolve({
                        salt: salt,
                        password: String(sha512(password, salt)),
                    });

                }, function(err) {
                    reject(err);
                });

            });
        };


        function fieldByValue(db, field, value) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("users", field, value).then(function(user) {
                    resolve(user);
                }, function(err) {
                    reject(err);
                });
            });
        }

        function fieldAvailable(db, field, value) {
            return new Promise(function(resolve, reject) {
                fieldByValue(db, field, value).then(function(row) {
                    if (Object.keys(row).length > 0) {
                        resolve(false);
                    }
                    resolve(true);
                }, function(err) {
                    reject("error getting field: ["+field+"] value: ["+value+ "], "+err);
                });
            });
        }

        function passwordsMatch(pass1, pass2) {
            return pass1 === pass2;
        }

        function validEmail(email) {
            return emailRegex.test(String(email).toLowerCase());
        }


        function newUser(db, email, username, password) {
            return new Promise(function(resolve, reject) {
                saltHashPassword(password).then(function(sPwd) {
                    db.newUser(email, username, sPwd.password, sPwd.salt).then(function(res) {
                        db.rowsByField("users", "username", username).then(function(user) {

                            var userObj = new User(user[0].username, user[0].email, user[0].id);
                            challengeHandler.newChallenge(userObj.id).then(function(challenge) {
                                resolve(userObj);
                                return;

                            }, function(err) {
                                reject(err);
                            });
                        }, function(err) {
                            reject(err);
                            return;
                        });

                    }, function(err) {
                        reject(err);
                    });

                }, function(err) {
                    reject(err);
                });
            });
        }

        function correctPassword(db, username, password) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("users", "username", username).then(function(user) {

                    if (user.length == 0) {
                        reject("user does not exist");
                        return;
                    }

                    var saltedPassword = sha512(password, user[0].salt);

                    if (!(saltedPassword === user[0].password)) {
                        reject("incorrect password");
                        return;
                    }

                    var userObj = new User(user[0].username, user[0].email, user[0].id);
                    userObj.image = user.image;

                    resolve(userObj);

                }, function(err) {
                    reject("error getting user by username: " + err);
                });
            });
        }


        var signUp = function signUp(email, username, pass1, pass2) {
            return new Promise(function(resolve, reject) {
                var err = {
                    noEmail: false,
                    noUsername: false,
                    noPasword1: false,
                    noPasword2: false,
                    passwordMatch: false,
                    emailNotValid: false,
                    message: ""
                };

                if (email.length == 0) {
                    err.message += "No email provided.\n";
                    err.noEmail = true;
                }

                if (username.length == 0) {
                    err.message += "No username provided.\n";
                    err.noUsername = true;
                }

                if (pass1.length == 0) {
                    err.message += "No password provided.\n";
                    err.noPasword1 = true;
                }
                if (pass2.length == 0) {
                    err.message += "No re-password provided.\n";
                    err.noPasword2 = true;
                }

                if (!passwordsMatch(pass1, pass2)) {
                    err.message += "Passwords do not match.\n";
                    err.passwordMatch = true;
                }

                if (!validEmail(email)) {
                    err.message += "Not a valid email.\n";
                    err.emailNotValid = true;
                }

                if (err.message != "") {
                    reject(err);
                    return;
                }

                fieldAvailable(db, "username", username).then(function(available) {
                    var err = {
                        usernameAvail: true,
                        emailAvail: true,
                        message: ""
                    };

                    if (!available) {
                        err.message += "Username is already taken.\n";
                        err.usernameAvail = false;
                    }

                    fieldAvailable(db, "email", email).then(function(available) {
                        if (!available) {
                            err.message += "Email is already taken.\n";
                            err.emailAvail = true;
                        }

                        if (err.message != "") {
                            reject(err);
                            return;
                        }

                        newUser(db, email, username, pass1).then(function(user) {
                            resolve(user);
                            return;

                        }, function(err) {
                            reject("failed to create new user: " + err);
                            return;
                        });

                    }, function(err) {
                        reject(err);
                        return;
                    });

                }, function(err) {
                    reject(err);
                    return;
                });
            });
        };

        var signIn = function(username, password) {
            return new Promise(function(resolve, reject) {
                correctPassword(db, username, password).then(function(res) {
                    resolve(res);
                }, function(err) {
                    reject(err);
                });
            });
        };

        var uploadImage = function(db, id, image) {
            return new Promise(function(resolve, reject) {
                var path = "'/imgs/" + id + ".jpeg'";
                db.updateFieldByValue("users", "image", path, "id", id).then(function(res) {
                    var base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                    fs.writeFile("img.jpeg", base64Data, 'base64', function(err){
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve('File saved.');
                        return;
                    })
                }, function(err) {
                    reject(err);
                });
            });
        };

        return {
            signUp:function(email, username, pass1, pass2) {
                return signUp(email, username, pass1, pass2);
            },
            signIn:function(username, password) {
                return signIn(username, password);
            },
            uploadImage:function(id, image) {
                return uploadImage(db, id, image);
            },
        }
    }());
}
