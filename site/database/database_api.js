"use strict";

var sqlite3 = require("sqlite3");
var fs = require('fs');

const dbName = "./db.sqlite3";
const selectAll = "SELECT * FROM ";
const insertInto = "INSERT INTO ";
const deleteFrom = "DELETE FROM ";

module.exports = {
    newDatabase: newDatabase
};

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

function getRowsByFieldString(table, field, value) {
    return selectAll + table + " WHERE " + field + " = '" + value + "';";
}

// Our database module with API
function newDatabase() {
    return (function() {
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

        var deleteRow = function deleteRow(db, table, id) {
            return new Promise(function deleteRow(db, table, id) {
                db.all(deleteRowString(table, id), function (err, row) {
                    if (err) {
                        reject("failed to delete " + id + " from " + table + ": " + err.message);
                    }
                    resolve(id);
                });
            });
        };

        var rowsByField = function(db, table, field, value) {
            return new Promise(function(resolve, reject) {
                db.all(getRowsByFieldString(table, field, value), [], (err, user) => {
                    if (err) {
                        reject("failed to find " + field + ":" + value + ": " + err.message);
                    }
                    resolve(user);
                });
            });
        };

        var newUser = function(db, email, username, password) {
            return new Promise(function(resolve, reject) {
                db.all(insertUserString(email, username, password), [], (err, user) => {
                    if (err) {
                        reject("failed to create user " + username + ": " + err.message);
                    }
                    resolve(username);
                });
            });
        };

        var ensure = function ensure(db) {
            console.log("ensuring database");
            return new Promise(function(resolve, reject) {
                db.all("CREATE TABLE if not exists users (email TEXT, username TEXT, password TEXT, image BLOB)", (err) => {
                    if (err) {
                        reject("failed to ensure user table " + err);
                    }
                    resolve();
                });
            });
        };


        return{
            close:function() {
                db.close((err) => {
                    if (err) {
                        return console.error(err.message);
                    }

                    console.log("database closed successfully!");
                });
            },
            rowById:function(table, id) {
                return rowById(db, table, id);
            },
            deleteById:function(table, id) {
                return deleteRow(db, table, id);
            },
            rowsByField:function(table, field, value) {
                return rowsByField(db, table, field, value);
            },
            newUser:function(email, username, password) {
                return newUser(db, email, username, password);
            },
            newUser:function(email, username, password) {
                return newUser(db, email, username, password);
            },
            ensure:function() {
                return ensure(db);
            },
        }
    }());
};
