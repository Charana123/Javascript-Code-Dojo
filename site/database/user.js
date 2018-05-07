"use strict"

var database_api = require('./database_api.js');
var database = database_api.newDatabase();

function fieldByValue(field, value) {
    return new Promise(function(resolve, reject) {
        database.rowsByField("users", field, value).then(function(user) {
            resolve(user);
        }, function(err) {
            reject(err);
        });
    });
}

function fieldAvailable(field, value) {
    return new Promise(function(resolve, reject) {
        fieldByValue(field, value).then(function(row) {
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

function newUser(email, username, password) {
    return new Promise(function(resolve, reject) {
        database.newUser(email, username, password).then(function(username) {
            resolve(username);
        }, function(err) {
            reject(err);
        });
    });
}

function signUp(email, username, pass1, pass2) {
    if (email.length == 0) {
        throw "No email provided.";
        return;
    }
    if (username.length == 0) {
        throw "No username provided.";
        return;
    }
    if (pass1.length == 0) {
        throw "No password provided.";
        return;
    }
    if (pass2.length == 0) {
        throw "No re-password provided.";
        return;
    }

    if (!passwordsMatch(pass1, pass2)) {
        throw "Passwords do not match.";
        return;
    }

    if (!validEmail(email)) {
        throw "Not a valid email.";
        return;
    }

    fieldAvailable("username", username).then(function(available) {
        if (!available) {
            throw "Username is already taken.";
            return;
        }
        fieldAvailable("email", email).then(function(available) {
            if (!available) {
                throw "Email is already taken.";
                return;
            }
            newUser(email, username, pass1).then(function(username) {
                console.log("new user created: " + username);
            }, function(err) {
                throw "failed to create new user: " + err;
                return;
            });

        }, function(err) {
            throw err;
            return;
        });

    }, function(err) {
        throw err;
        return;
    });
}
