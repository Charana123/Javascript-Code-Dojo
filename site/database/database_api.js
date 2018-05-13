"use strict";

const sqlite3 = require("sqlite3");
const fs = require('fs');

const selectAll = "SELECT * FROM ";
const insertInto = "INSERT INTO ";
const deleteFrom = "DELETE FROM ";
const update = "UPDATE ";

const ensureUserStr = "CREATE TABLE if not exists users " +
    "(id INTEGER PRIMARY KEY, email TEXT, username TEXT," +
    "password TEXT, salt TEXT, image BLOB)";

const ensureChallengeStr = "CREATE TABLE if not exists challenges " +
    "(user INTEGER" +
    challengesFieldString(5) +
    ", FOREIGN KEY(user) REFERENCES users(id))";

const ensureForumPostStr = "CREATE TABLE if not exists forum_post " +
    "(id INTEGER PRIMARY KEY, user INTEGER, title TEXT, body TEXT, subject TEXT," +
    "time DATETIME)";

const ensureForumReplyStr = "CREATE TABLE if not exists forum_reply " +
    "(id INTEGER, user INTEGER, body TEXT," +
    "time DATETIME, FOREIGN Key(id) REFERENCES forum_post(id))";

module.exports = {
    newDatabase: newDatabase
};

function challengesFieldString(count) {
    var str = "";

    for (var i = 0; i < count; i++) {
        str += ", challenge_complete_" + i + " INTEGER"
    }

    return str;
}

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

function insertUserString(email, username, password, salt) {
    return insertInto + "users (email, username, password, salt) VALUES ('" + email +
        "', '" + username + "', '"  + password + "', '" + salt + "');";
}

function insertChallengeStringZeros(userId) {
    return insertInto + "challenges (user, challenge_complete_0, challenge_complete_1, challenge_complete_2, challenge_complete_3, challenge_complete_4) VALUES ('" + userId +
        "', '" + 0 + "', '"  + 0 + "', '" + 0 + "', '" + 0 + "', '"  + 0 + "');";
}

function updateChallengeString(userId, statusArr) {
    return update + "challenges SET challenge_complete_0 = " + statusArr[0]
                  + ", challenge_complete_1 = " + statusArr[1]
                  + ", challenge_complete_2 = " + statusArr[2]
                  + ", challenge_complete_3 = " + statusArr[3]
                  + ", challenge_complete_4 = " + statusArr[4]
    + "WHERE user = " + userId + ";";
}

function insertPostStr(userId, title, body, subject) {
    return insertInto + "forum_post (user, title, body, subject, time) VALUES(' " + userId +
        "', '" + title + "', '" + body + "', '" + subject + "', datetime('now','localtime'));";
}

function insertReplyStr(postId, userId, body) {
    return insertInto + "forum_reply (id, user, body, time) VALUES(' " + postId +
        "', '" + userId + "', '" + body + "', datetime('now','localtime'));";
}

function getRowsByFieldString(table, field, value) {
    return selectAll + table + " WHERE " + field + " = '" + value + "';";
}

// Our database module with API
function newDatabase(dbName) {
    return (function() {
        var db = getDatabase(dbName);

        var rowById = function(db, table, id) {
            return new Promise(function(resolve, reject) {
                db.get(getRowByIdString(table, id), function(err, row) {
                    if (err) {
                        reject("failed to read " + id + " from table " + table + " in database: " + err.message);
                        return;
                    }
                    resolve(row);
                });
            });
        };

        var deleteRow = function(db, table, id) {
            return new Promise(function deleteRow(db, table, id) {
                db.all(deleteRowString(table, id), function (err, row) {
                    if (err) {
                        reject("failed to delete " + id + " from " + table + ": " + err.message);
                        return;
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
                        return;
                    }
                    resolve(user);
                });
            });
        };

        var newUser = function(db, email, username, password, salt) {
            return new Promise(function(resolve, reject) {
                db.all(insertUserString(email, username, password, salt), [], (err, user) => {
                    if (err) {
                        reject("failed to create user " + username + ": " + err.message);
                        return;
                    }
                    resolve(user);
                });
            });
        };

        var newChallenge = function(db, userId) {
            return new Promise(function(resolve, reject) {
                db.all(insertChallengeStringZeros(userId), [], (err, challenge) => {
                    if (err) {
                        reject("failed to create challenge record " + userId + ": " + err.message);
                        return;
                    }
                    resolve(challenge);
                });
            });
        };

        var updateChallenge = function(db, userId, statusArr) {
            return new Promise(function(resolve, reject) {
                db.all(updateChallenge(userId, statusArr), [], (err, challenge) => {
                    if (err) {
                        reject("failed to update challenge record " + userId + ": " + err.message);
                        return;
                    }

                    resolve(challenge);
                });
            });
        };

        var newForumPost = function(db, userId, title, body, subject) {
            return new Promise(function(resolve, reject) {
                db.all(insertPostStr(userId, title, body, subject), [], (err, post) => {
                    if (err) {
                        reject("failed to create forum post record " + userId + ": " + err);
                        return;
                    }
                    resolve(post);
                    return;
                });
            });
        };

        var newForumReply = function(db, postId, userId, body) {
            return new Promise(function(resolve, reject) {
                db.all(insertReplyStr(postId, userId, body), [], (err, post) => {
                    if (err) {
                        reject("failed to create forum reply record " + userId + ": " + err);
                        return;
                    }
                    resolve(post);
                    return;
                });
            });
        };

        var ensure = function(db) {
            console.log("Ensuring database tables");
            return new Promise(function(resolve, reject) {
                db.all(ensureUserStr, (err) => {
                    if (err) {
                        reject("failed to ensure user table " + err);
                        return;
                    }
                    db.all(ensureChallengeStr, (err) => {
                        if (err) {
                            reject("failed to ensure challenges table " + err);
                            return;
                        }
                        db.all(ensureForumPostStr, (err) => {
                            if (err) {
                                reject("failed to ensure forum_post table " + err);
                                return;
                            }
                            db.all(ensureForumReplyStr, (err) => {
                                if (err) {
                                    reject("failed to ensure forum_post table " + err);
                                }
                                resolve();
                            });
                        });
                    });
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
            newUser:function(email, username, password, salt) {
                return newUser(db, email, username, password, salt);
            },
            newChallenge:function(userId) {
                return newChallenge(db, userId);
            },
            updateChallenge:function(userId, statusArr) {
                return updateChallenge(db, userId, statusArr);
            },
            newForumPost:function(userId, title, body, subject) {
                return newForumPost(db, userId, title, body, subject);
            },
            newForumReply:function(postId, userId, body) {
                return newForumReply(db, postId, userId, body);
            },
            ensure:function() {
                return ensure(db);
            },
        }
    }());
};
