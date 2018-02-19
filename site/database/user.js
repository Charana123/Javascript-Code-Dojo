"use strict"

const database_api = require('./database_api.js');
const database = database_api.newDatabase();

function fieldAvailable(field, username) {
    return new Promise(function(resolve, reject) {
        database.rowsByField("users", field, username).then(function(user) {
            if (Object.keys(user).length > 0) {
                resolve(true);
            }
            resolve(false);

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
    }
    if (username.length == 0) {
        throw "No username provided.";
    }
    if (pass1.length == 0) {
        throw "No password provided.";
    }
    if (pass2.length == 0) {
        throw "No re-password provided.";
    }

    if (!passwordsMatch(pass1, pass2)) {
        throw "Passwords do not match.";
    }

    if (!validEmail(email)) {
        throw "Not a valid email.";
    }

    if (!fieldAvailable("username", username)) {
        throw "Username is already taken.";
    }

    if (!fieldAvailable("email", email)) {
        throw "Email is already taken.";
    }

    newUser(email, username, pass1).then(function(username) {
        console.log("new user created: " + username);
    }, function(err) {
        throw "failed to create new user: " + err;
    });
}
