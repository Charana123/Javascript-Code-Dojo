"use strict";

const sqlite3 = require("sqlite3");
const fs = require('fs');
const questionsJSON = require("./questions.json");
const postJSON = require("../dummy_data/posts.json");
const replyJSON = require("../dummy_data/replys.json");
const userJSON = require("../dummy_data/users.json");

const selectAll = "SELECT * FROM ";
const insertInto = "INSERT INTO ";
const deleteFrom = "DELETE FROM ";
const update = "UPDATE ";

const CHALLENGES_NUM = 6;

const ensureUserStr = "CREATE TABLE if not exists users " +
    "(id INTEGER PRIMARY KEY, email TEXT, username TEXT," +
    "password TEXT, salt TEXT, image TEXT);";

const ensureChallengeStr = "CREATE TABLE if not exists challenges " +
    "(user INTEGER" +
    challengesFieldString(CHALLENGES_NUM) +
    ", FOREIGN KEY(user) REFERENCES users(id));";

const ensureForumPostStr = "CREATE TABLE if not exists forum_post " +
    "(id INTEGER PRIMARY KEY, user INTEGER, title TEXT, body TEXT, subject TEXT," +
    "views INTEGER, votes INTEGER, time DATETIME);";

const ensureForumReplyStr = "CREATE TABLE if not exists forum_reply " +
    "(id INTEGER PRIMARY KEY, post INTEGER, parent INTEGER, user INTEGER, body TEXT," +
    "votes INTEGER, time DATETIME, FOREIGN KEY(post) REFERENCES forum_post(id));";

const ensureQuestionStr = "CREATE TABLE if not exists questions " +
    "(id INTEGER PRIMARY KEY, title TEXT, question TEXT, answer_file TEXT, "+
    "start_code TEXT);";

const ensureVotedPost = "CREATE TABLE if not exists voted_post " +
    "(user INTEGER, post INTEGER, value INTEGER, FOREIGN KEY(user) REFERENCES users(id))";

const ensureVotedReply = "CREATE TABLE if not exists voted_reply " +
    "(user INTEGER, reply INTEGER, value INTEGER, FOREIGN KEY(user) REFERENCES users(id))";

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

function insertUserWithImageString(email, username, password, salt, image) {
    return insertInto + "users (email, username, password, salt, image) VALUES ('" + email +
        "', '" + username + "', '"  + password + "', '" + salt + "', '" + image + "');";
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

function updateChallengeStr(userId, index, status) {
    return update + "challenges SET challenge_complete_"+index+" = "+status +
        " WHERE user = " + userId + ";";
}

function updateFieldByValueStr(table, field, value, where, id) {
    return update + table + " SET " + field + " = " + value + " WHERE " + where + " = " + id + ";";
};

function insertPostStr(userId, title, body, subject) {
    return insertInto + "forum_post (user, title, body, subject, views, votes, time) VALUES(" + userId +
        ", '" + title + "', '" + body + "', '" + subject + "', 0, 1, datetime('now','localtime'));";
}

function insertPostStrWithId(id, userId, title, body, subject, views) {
    return insertInto + "forum_post (id, user, title, body, subject, views, votes, time) VALUES(" + id +
        ", " +  userId + ", '" + title + "', '" + body + "', '" + subject + "', " + views + ", 1, datetime('now','localtime'));";
}

function insertReplyStr(postId, parent, userId, body, id) {
    if (id) {
        return insertInto + "forum_reply (id, post, parent, user, body, votes, time) VALUES(" +id + ", " + postId +
            ", " + parent + ", " + userId + ", '" + body + "', 1, datetime('now','localtime'));";

    } else {
        return insertInto + "forum_reply (post, parent, user, body, votes, time) VALUES(" + postId +
            ", " + parent + ", " + userId + ", '" + body + "', 1, datetime('now','localtime'));";
    };
}

function insertQuestionStr(id, title, question, answer_file, start_code) {
    return insertInto + "questions (id, title, question , answer_file, start_code) VALUES (" + id + ",'" + title + "', '" + question + "', '"  + answer_file + "', '" + start_code + "');";
}


function getVotePostRow(user, post) {
    return selectAll + "voted_post WHERE user = " + user + " AND post = "+ post+";";
}

function getVoteReplyRow(user, reply) {
    return selectAll + "voted_reply WHERE user = " + user + " AND reply = "+ reply+";";
}

function insertVotePost(user, post, value) {
    return insertInto + "voted_post (user, post, value) VALUES(" + user + ", "+post+", "+value+");";
}

function insertVoteReply(user, reply, value) {
    return insertInto + "voted_reply (user, reply, value) VALUES(" + user + ", "+reply+", "+value+");";
}

function updateVotePost(user, post, value) {
    return "UPDATE voted_post SET value = "+value+" WHERE user = "+user+" AND post = "+post+";";
}

function updateVoteReply(user, reply, value) {
    return "UPDATE voted_reply SET value = "+value+" WHERE user = "+user+" AND reply = "+reply+";";
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

        var newUserWithImage = function(db, email, username, password, salt, image) {
            return new Promise(function(resolve, reject) {
                db.all(insertUserWithImageString(email, username, password, salt, image), [], (err, user) => {
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

        var updateVotePost = function(db, user, post, value) {
            return new Promise(function(resolve, reject) {
                db.all(getVotePostRow(user, post), [], (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (res.length == 0) {
                        db.all(insertVotePost(user, post, value), [], (err, res) => {
                            if (err) {
                                reject(err)
                                return;
                            }

                            resolve(res);
                            return;
                        });

                    } else {
                        db.all(updateVotePost(user, post, value), [], (err, res) => {
                            if (err) {
                                reject(err)
                                return;
                            }

                            resolve(res);
                            return;
                        });
                    }
                });
            });
        };

        var updateVoteReply = function(db, user, reply, value) {
            return new Promise(function(resolve, reject) {
                db.all(getVoteReplyRow(user, reply), [], (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (res.length == 0) {
                        db.all(insertVoteReply(user, reply, value), [], (err, res) => {
                            if (err) {
                                reject(err)
                                return;
                            }

                            resolve(res);
                            return;
                        });
                    } else {
                        db.all(updateVotePost(user, reply, value), [], (err, res) => {
                            if (err) {
                                reject(err)
                                return;
                            }

                            resolve(res);
                            return;
                        });
                    }
                });
            });
        };

        var updateChallenge = function(db, userId, index, status) {
            return new Promise(function(resolve, reject) {
                db.all(updateChallengeStr(userId, index, status), [], (err, challenge) => {
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

        var newForumReply = function(db, postId, parent, userId, body, id) {
            return new Promise(function(resolve, reject) {
                db.all(insertReplyStr(postId, parent, userId, body, id), [], (err, post) => {
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
                    ensureVotedPost,
                    ensureVotedReply,
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
                            rs.push(newForumReply(db, r.post, r.parent, r.user, r.body, r.id));
                        });

                        userJSON.forEach((u) => {
                            rs.push(newUserWithImage(db, u.email, u.username, u.password, u.salt, u.image));

                        });

                        Promise.all(rs).then(function(res) {
                            resolve(res);
                            return;
                        }, function(err) {
                            reject("failed to ensure replys: "+err);
                            return;
                        });

                    }, function(err) {
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
            updateChallenge:function(userId, index, status) {
                return updateChallenge(db, userId, index, status);
            },
            newForumPost:function(userId, title, body, subject) {
                return newForumPost(db, userId, title, body, subject);
            },
            newForumReply:function(postId, parent, userId, body) {
                return newForumReply(db, postId, parent, userId, body);
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
            updateVotePost:function(user, post, value){
                return updateVotePost(db, user, post, value);
            },
            updateVoteReply:function(user, reply, value){
                return updateVoteReply(db, user, reply, value);
            },
        }
    }());
};
