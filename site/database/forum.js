"use strict"

const challengeAPI = require("./challenges.js")

module.exports = {
    ForumHandler: ForumHandler
};

function ForumHandler(database) {
    return (function() {

        var db = database;
        var challengeHandler = challengeAPI.ChallengesHandler(db);

        function getReplys(postId) {
            return new Promise(function (resolve, reject) {
                db.rowsByField("form_reply", "id", postId).then(function(replys) {
                    resolve(replys);
                    return;
                }, function(err) {
                    reject("unable to get forum replys by post ID: "+err);
                    return;
                });
            });
        };

        var newPost = function(db, userId, title, body, subject) {
            return new Promise(function(resolve, reject) {
                db.newForumPost(userId, title, body, subject).then(function(res) {
                    resolve(res);
                    return;
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        }

        var newReply = function(db, postId, userId, body) {
            return new Promise(function(resolve, reject) {
                db.newForumReply(postId, userId, body).then(function(res) {
                    resolve(res);
                    return;
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        }

        var getForumsByUser = function(db, userId) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("form_post", "user", userId).then(function(posts) {
                    var fullForums = [];

                    for (var post in posts) {
                        getReplys(post.id).then(function(replys) {
                            fullForums.push({post: post, replys: replys});
                        }, function(err) {
                            reject(err);
                            return;
                        });
                    }

                    resolve(fullForums);
                    return;

                }, function(err) {
                    reject("unable to get forum posts by user: "+err);
                });
            });
        }

        var getForumsBySubject = function(db, subject) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("form_post", "subject", subject).then(function(posts) {
                    var fullForums = [];

                    for (var post in posts) {
                        getReplys(post.id).then(function(replys) {
                            fullForums.push({post: post, replys: replys});
                        }, function(err) {
                            reject(err);
                            return;
                        });
                    }

                    resolve(fullForums);
                    return;

                }, function(err) {
                    reject("unable to get forum posts by subject: "+err);
                });
            });
        }

        return {
            newPost:function(userId, title, body, subject){
                return newPost(db, userId, title, body, subject);
            },
            newReply:function(postId, userId, body){
                return newPost(db, postId, userId, title, body);
            },
            getForumsByUser:function(userId){
                return getForumsByUser(db, userId);
            },
            getForumsBySubject:function(subject){
                return getForumsBySubject(db, subject);
            },
        }

    }());
}
