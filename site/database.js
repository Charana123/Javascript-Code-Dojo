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

    var userById = function(db, username) {
        return new Promise(function(resolve, reject) {
            db.each(getUserByUsernameString(username), function (err, user) {
                if (err) {
                    reject("failed to find user " + username + ": " + err.message);
                }
                resolve(user);
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
        userById:function(username) {
            return userById(db, username);
        }
    }
}());

database.userById("boo").then(function(user) {
    console.log(user.id);
}, function(err) {
    console.log(err);
});

//database.rowById("users", 4).then(function(row) {
//    console.log(row.username);
//}, function(err) {
//    console.log("HERE");
//    console.log(err);
//});

database.close();

//
//function deleteRow(db, table, id) {
//    db.all(deleteRowString(table, id), function (err, row) {
//        if (err) {
//            console.log("failed to delete " + id + " from " + table + ": " + err.message);
//            return;
//        }
//        console.log("Deleted " + id + " from " + table);
//    });
//}
//
//function newUser(db, email, username, password) {
//    db.all(insertUserString(email, username, password), function (err, user) {
//        if (err) {
//            console.log("failed to create user " + username + ": " + err.message);
//            return;
//        }
//        console.log("Created user: " + username);
//    });
//}
//
//getUserByUsername(db, "foo").then(function(value) {
//  console.log(value);
//});

//console.log("bar: " + user.username);
//deleteRow(db, "users", 1);
//getRowById(db, "users", 1);
//user = get
//newUser("foo@gmail.com", "foo", "pass");
//console.log(insertUserString("foo@gmail.com", "foo", "pass"));
