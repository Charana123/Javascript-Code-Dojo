"use strict";

const sqlite3 = require("sqlite3");
const fs = require('fs');
const questionsJSON = require("./questions.json");
const postJSON = require("../dummy_data/posts.json");
const replyJSON = require("../dummy_data/replys.json");

const selectAll = "SELECT * FROM ";
const insertInto = "INSERT INTO ";
const deleteFrom = "DELETE FROM ";
const update = "UPDATE ";

const CHALLENGES_NUM = 6;

const ensureUserStr = "CREATE TABLE if not exists users " +
    "(id INTEGER PRIMARY KEY, email TEXT, username TEXT," +
    "password TEXT, salt TEXT, image TEXT)";

const ensureChallengeStr = "CREATE TABLE if not exists challenges " +
    "(user INTEGER" +
    challengesFieldString(CHALLENGES_NUM) +
    ", FOREIGN KEY(user) REFERENCES users(id))";

const ensureForumPostStr = "CREATE TABLE if not exists forum_post " +
    "(id INTEGER PRIMARY KEY, user INTEGER, title TEXT, body TEXT, subject TEXT," +
    "views INTEGER, time DATETIME)";

const ensureForumReplyStr = "CREATE TABLE if not exists forum_reply " +
    "(id INTEGER, user INTEGER, body TEXT," +
    "time DATETIME, FOREIGN Key(id) REFERENCES forum_post(id))";

const ensureQuestionStr = "CREATE TABLE if not exists questions " +
    "(id INTEGER PRIMARY KEY, title TEXT, question TEXT, answer_file TEXT, "+
    "start_code TEXT);";

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

function getAllField(table) {
    return selectAll + table + ";";
}

function deleteRowString(table, id) {
    return deleteFrom + table + " WHERE id = " + id + ";";
}

function insertUserString(email, username, password, salt) {
    return insertInto + "users (email, username, password, salt) VALUES ('" + email +
        "', '" + username + "', '"  + password + "', '" + salt + "');";
}

function insertChallengeStringZeros(userId) {
    var str = insertInto + "challenges (user";
    for (var i = 0; i < CHALLENGES_NUM; i++) {
        str += ", challenge_complete_" + i;
    }

    str +=") VALUES (" + userId;
    for (var i = 0; i < CHALLENGES_NUM; i++) {
        str += ", " + 0;
    }
    str += ");";

    return str;
}

function updateChallengeString(userId, statusArr) {
    var str = update + "challenges SET ";
    str += "challenge_complete_0 = " + statusArr[0];

    for (var i = 1; i < CHALLENGES_NUM; i++) {
        str += ", challenge_complete_" + i + " = " + statusArr[i];
    }
    str += "WHERE user = " + userId + ";";

    return str;
}

function updateFieldByValueStr(table, field, value, where, id) {
    return update + table + " SET " + field + " = " + value + " WHERE " + where + " = " + id + ";";
};

function insertPostStr(userId, title, body, subject) {
    return insertInto + "forum_post (user, title, body, subject, views, time) VALUES(" + userId +
        ", " + title + "', '" + body + "', '" + subject + "', 0, datetime('now','localtime'));";
}

function insertPostStrWithId(id, userId, title, body, subject, views) {
    return insertInto + "forum_post (id, user, title, body, subject, views, time) VALUES(" + id +
        ", " +  userId + ", '" + title + "', '" + body + "', '" + subject + "', " + views + ", datetime('now','localtime'));";
}

function insertReplyStr(postId, userId, body) {
    return insertInto + "forum_reply (id, user, body, time) VALUES(' " + postId +
        "', '" + userId + "', '" + body + "', datetime('now','localtime'));";
}

function insertQuestionStr(id, title, question, answer_file, start_code) {
    return insertInto + "questions (id, title, question , answer_file, start_code) VALUES (" + id + ",'" + title + "', '" + question + "', '"  + answer_file + "', '" + start_code + "');";
}

function getRowsByFieldString(table, field, value) {
    return selectAll + table + " WHERE " + field + " = '" + value + "';";
}

// Our database module with API
function newDatabase(dbName) {
    return (function() {
        var db = getDatabase(dbName);

        var getAll = function(db, table) {
            return new Promise(function(resolve, reject) {
                db.all(getAllField(table), function(err, res) {
                    if (err) {
                        reject("failed to read all from table " + table + " in database: " + err.message);
                        return;
                    }
                    resolve(res);
                });
            });
        };


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
                db.all(getRowsByFieldString(table, field, value), [], (err, res) => {
                    if (err) {
                        reject("failed to find " + field + ":" + value + ": " + err.message);
                        return;
                    }
                    resolve(res);
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
                        reject("failed to create challenge record " + userId + ": " + err);
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

        var updateFieldByValue = function(db, table, field, value, where, id) {
            return new Promise(function(resolve, reject) {
                console.dir(updateFieldByValueStr(table, field, value, where, id));
                db.all(updateFieldByValueStr(table, field, value, where, id), [], (err, res) => {
                    if (err) {
                        reject("failed to update record " + id + ": " + err);
                        return;
                    }
                    resolve(res);
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

        var newForumPostWithId = function(db, id, userId, title, body, subject, views) {
            return new Promise(function(resolve, reject) {
                db.all(insertPostStrWithId(id, userId, title, body, subject, views), [], (err, post) => {
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

        var newQuestion = function(db, id, title, question, answer_file, start_code) {
            return new Promise(function(resolve, reject) {
                db.all(insertQuestionStr(id, title, question, answer_file, start_code), [], (err, question) => {
                    if (err) {
                        reject("failed to create question record: " + err);
                        return;
                    }

                    resolve(question);
                    return;
                });
            });
        };

        var ensureTables = function(db) {
            console.log("Ensuring database tables");
            return new Promise(function(resolve, reject) {

                var promises = [];
                var tables = [
                    ensureUserStr,
                    ensureChallengeStr,
                    ensureForumPostStr,
                    ensureForumReplyStr,
                    ensureQuestionStr,
                ]

                tables.forEach((table) => {
                    promises.push(db.all(table));
                });

                Promise.all(promises).then(function(res) {
                    resolve(res);

                }, function(err) {
                    reject("failed to ensure database tables: "+err);
                    return;
                });
            });
        };

        var ensureQuestions = function(db) {
            return new Promise(function(resolve, reject) {
                rowsByField(db, "questions", "id", 1).then(function(res) {
                    if (res.length != 0) {
                        resolve(res);
                        return;
                    }

                    var qs = [];

                    questionsJSON.forEach((q) => {
                        qs.push(newQuestion(db, q.id, q.title.replace(/\'/g,"''"),
                            q.question.replace(/\'/g,"''"),
                            q.answer_file, q.start_code.replace(/\'/g,"''")));
                    });

                    Promise.all(qs).then(function(res) {
                        resolve(res);
                        return;
                    }, function(err) {
                        reject("failed to ensure questions: "+err);
                        return;
                    });
                });
            });
        };

        var dummyForum = function(db) {
            return new Promise(function(resolve, reject) {
                rowsByField(db, "forum_post", "id", 1).then(function(res) {
                    if (res.length != 0) {
                        resolve(res);
                        return;
                    }

                    var ps = [];
                    postJSON.forEach((p) => {
                        ps.push(newForumPostWithId(db, p.id, p.user, p.title, p.body, p.subject, p.views));
                    });

                    Promise.all(ps).then(function(res) {

                        var rs = [];

                        replyJSON.forEach((r) => {
                            rs.push(newForumReply(db, r.id, r.user, r.body));
                        });

                        Promise.all(rs).then(function(res) {
                            resolve(res);
                            return;
                        }, function(err) {
                            reject("failed to ensure replys: "+err);
                            return;
                        });

                    }, function(err) {
                        console.log("HERE>"+err);
                        reject("failed to ensure posts: "+err);
                        return;
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
            getAll:function(table) {
                return getAll(db, table);
            },
            deleteById:function(table, id) {
                return deleteRow(db, table, id);
            },
            rowsByField:function(table, field, value) {
                return rowsByField(db, table, field, value);
            },
            updateFieldByValue:function(table, field, value, where, id) {
                return updateFieldByValue(db, table, field, value, where, id);
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
            newQuestion:function(id, title, question, answer_file, start_code) {
                return newQuestion(db, id, title, question, answer_file, start_code);
            },
            ensureTables:function() {
                return ensureTables(db);
            },
            ensureQuestions:function() {
                return ensureQuestions(db);
            },
            dummyForum:function() {
                return dummyForum(db);
            },
        }
    }());
};
