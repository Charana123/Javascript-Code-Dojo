"use strict"

module.exports = {
    User: User
};

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function User(database) {
    return (function() {

        var db = database;

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
                db.newUser(email, username, password).then(function(username) {
                    resolve(username);
                }, function(err) {
                    reject(err);
                });
            });
        }

        function correctPassword(db, username, password) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("users", "username", username).then(function(user) {

                    if (String(user[0].password) != String(password)) {
                        resolve(false);
                        return;
                    }

                    resolve(true);

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
                            var res = "new user created: " + username;
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
