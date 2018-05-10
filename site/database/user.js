"use strict"

module.exports = {
    User: User
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
            reject(err);
        });
    });
}

function passwordsMatch(pass1, pass2) {
    return pass1 === pass2;
}

function validEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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

function User(db) {
    return (function(db) {
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
                            console.log("new user created: " + username);
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

                resolve("New user created!");
            });
        };

        return {
            signUp:function(email, username, pass1, pass2) {
                return signUp(email, username, pass1, pass2);
            },
        }
    }());
}
