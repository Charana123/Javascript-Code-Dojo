"use strict";

var sqlite3 = require("sqlite3");

const dbName = "./db.sqlite3";
const selectAll = "SELECT * FROM ";
const insertInto = "INSERT INTO ";
const deleteFrom = "DELETE FROM ";

// Database _init_ function
function getDatabase(fileName) {
    return new sqlite3.Database(fileName, (err) => {
        if(err) {
            console.log("failed to open database '" + fileName + "': "+ err.message);
            return;
        }
        console.log("Found and opened SQlite3 database: " + fileName);
    });
}

// Helper functions
function getRowByIdString(table, id) {
    return selectAll + table + " WHERE id = " + id + ";";
}

function deleteRowString(table, id) {
    return deleteFrom + table + " WHERE id = " + id + ";";
}

function insertUserString(email, username, password) {
    return insertInto + "users (email, username, password) VALUES ('" + email +
        "', '" + username + "', '"  + password + "');";
}

function getUserByUsernameString(username) {
    return selectAll + "users WHERE username = '" + username + "';";
}

// Our database module with API
var database = (function() {
    var db = getDatabase(dbName);

    var rowById = function getRowById(db, table, id) {
        return new Promise(function(resolve, reject) {
            db.get(getRowByIdString(table, id), function(err, row) {
                if (err) {
                    reject("failed to read " + id + " from table " + table + " in database: " + err.message);
                }
                resolve(row);
            });
        });
    };

    var deleteRow = function deleteRow(table, id) {
        return new Promise(function deleteRow(db, table, id) {
            db.all(deleteRowString(table, id), function (err, row) {
                if (err) {
                    reject("failed to delete " + id + " from " + table + ": " + err.message);
                }
                resolve(id);
            });
        });
    };

    var userById = function(db, username) {
        return new Promise(function(resolve, reject) {
            db.all(getUserByUsernameString(username), [], (err, user) => {
                if (err) {
                    reject("failed to find user " + username + ": " + err.message);
                }
                resolve(user);
            });
        });
    };

    var newUser = function(db, email, username, password) {
        return new Promise(function(resolve, reject) {
            db.all(insertUserString(email, username, password), function (err, user) {
                if (err) {
                    reject("failed to create user " + username + ": " + err.message);
                }
                resolve(username);
            });
        });
    };

    return{
        close:function() {
            db.close((err) => {
                if (err) {
                    return console.error(err.message);
                }
            });
        },
        rowById:function(table, id) {
            return rowById(db, table, id);
        },
        deleteById:function(table, id) {
            return deleteRow;
        },
        newUser:function(email, username, password) {
            return newUser;
        },
        userById:function(username) {
            return userById(db, username);
        }
    }
}());

database.userById("foo").then(function(user) {
    console.log(user);
}, function(err) {
    console.log(err);
});

database.close();
