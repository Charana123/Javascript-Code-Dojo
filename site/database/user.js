"use strict"

const database_api = require('./database_api.js');
const database = database_api.newDatabase();

function nameAvailable(username) {
    return new Promise(function(resolve, reject) {
        database.rowsByField("users", "username", username).then(function(user) {
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

function newUser(email, username, password) {
    return new Promise(function(resolve, reject) {
        database.newUser(email, username, password).then(function(username) {
            resolve(username);
        }, function(err) {
            reject(err);
        });
    });
}

nameAvailable("foo").then(function(available) {
    console.log(available);
}, function(err) {
    console.log(err);
});

newUser("email@gmail.com", "aname", "apass").then(function(username) {
    console.log(username);
}, function(err) {
    console.log(err);
});

