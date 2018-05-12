"use strict"

const crypto = require('crypto');
const challengeAPI = require("./challenges.js")

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
                    db.newUser(email, username, sPwd.password, sPwd.salt).then(function(user) {
                        var user = new User(user.username, user.email, user.id);
                        challengeHandler.newChallenge(user.id).then(function(challenge) {
                            resolve(user);
                            return;
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

                    var userObj = new User(user[0].username, user[0].email);
                    userObj.image = user.image;

                    resolve(userObj);

                }, function(err) {
                    reject("error getting user by username: " + err);
                });
            });
        }


        var signUp = function signUp(email, username, pass1, pass2) {
            return new Promise(function(resolve, reject) {
                var err = "";

                if (email.length == 0) {
                    err += "No email provided.\n";
                }

                if (username.length == 0) {
                    err += "No username provided.\n";
                }
                if (pass1.length == 0) {
                    err += "No password provided.\n";
                }
                if (pass2.length == 0) {
                    err += "No re-password provided.\n";
                }

                if (!passwordsMatch(pass1, pass2)) {
                    err += "Passwords do not match.\n";
                }

                if (!validEmail(email)) {
                    err += "Not a valid email.\n";
                }

                if (err != "") {
                    reject(err);
                    return;
                }

                fieldAvailable(db, "username", username).then(function(available) {
                    if (!available) {
                        err += "Username is already taken.\n";
                    }

                    fieldAvailable(db, "email", email).then(function(available) {
                        if (!available) {
                            err += "Email is already taken.\n";
                        }

                        if (err != "") {
                            reject(err);
                            return;
                        }

                        newUser(db, email, username, pass1).then(function(username) {
                            resolve(res);

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
        }

        return {
            signUp:function(email, username, pass1, pass2) {
                return signUp(email, username, pass1, pass2);
            },
            signIn:function(username, password) {
                return signIn(username, password);
            },
        }
    }());
}
