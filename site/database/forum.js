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
                db.rowsByField("forum_reply", "id", postId).then(function(replys) {
                    var promises = [];

                    replys.forEach((r) => {
                        promises.push(db.rowsByField("users", "id", r.user));
                    });

                    Promise.all(promises).then(function(users) {
                        users.forEach(function(u) {
                            replys.forEach((r, i) => {
                                if (r.user == u[0].id) {
                                    replys[i].userData = u[0];
                                }
                            });
                        });

                        resolve(replys);
                        return;
                    }, function(err) {
                        reject(err);
                        return;
                    });
                }, function(err) {
                    reject("unable to get forum replys by post ID: "+err);
                    return;
                });
            });
        };

        var sortReplsyByTime = function(x, y) {
            return y.time - x.time;
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
        };

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
        };

        var increaseViews = function(db, postId) {
            return new Promise(function(resolve, reject) {
                db.updateFieldByValue

            });
        };

        var increaseViews = function(db, post) {
            return new Promise(function(resolve, reject) {
                db.updateFieldByValue("forum_post", "views", post.views+1, "id", post.id).then(function(res) {
                    resolve(post);
                }, function(err) {

                });
            });
        };

        var getPost = function(db, postId) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("forum_post", "id", postId).then(function(posts) {
                    db.rowsByField("users", "id", posts[0].user).then(function(user) {
                        posts[0].userData = user[0];
                        getReplys(posts[0].id).then(function(replys) {
                            posts[0].replys = replys.sort(sortReplsyByTime);
                            increaseViews(db, posts[0]).then(function(post) {
                                resolve(posts[0]);
                                return;
                            }, function(err) {
                                reject(err)
                                return;
                            });

                        }, function(err) {
                            reject(err);
                            return;
                        });
                    }, function(err) {
                        reject(err);
                        return;
                    });
                }, function(err) {
                    reject(err);
                    return;
                });
            });
        };

        var getForumsByUser = function(db, userId) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("forum_post", "user", userId).then(function(posts) {
                    var promises = [];
                    var fullForums = {};

                    posts.forEach((post) => {
                        promises.push(getReplys(post.id));
                        fullForums[post.id] = {post: post, replys: []};
                    });

                    Promise.all(promises).then(function(resp) {
                        var replys = resp[0];
                        replys.sort
                        replys[0].forEach((reply) => {
                            fullForums[reply.id].replys.push(reply);
                        });
                        resolve(fullForums);
                        return;

                    }, function(err) {
                        reject(err);
                        return;
                    });

                }, function(err) {
                    reject("unable to get forum posts by user: "+err);
                });
            });
        };

        var getForumsBySubject = function(db, subject) {
            return new Promise(function(resolve, reject) {
                db.rowsByField("forum_post", "subject", subject).then(function(posts) {
                    var promises = [];
                    var fullForums = [];

                    posts.forEach((post) => {
                        promises.push(getReplys(post.id));
                        fullForums[post.id] = {post: post, replys: []};
                    });

                    Promise.all(promises).then(function(replys) {
                        replys[0].forEach((reply) => {
                            fullForums[reply.id].replys.push(reply);
                        });
                        resolve(fullForums);
                        return;

                    }, function(err) {
                        reject(err);
                        return;
                    });

                }, function(err) {
                    reject("unable to get forum posts by subject: "+err);
                });
            });
        };

        var getAllPosts = function(db) {
            return new Promise(function (resolve, reject) {
                db.getAll("forum_post").then(function(posts) {
                    var promises = [];
                    var fullForums = {};

                    posts.forEach((post) => {
                        promises.push(getReplys(post.id));
                        fullForums[post.id] = {post: post, user: {}, replys: []};
                    });

                    Promise.all(promises).then(function(replys) {
                        replys.forEach((group) => {
                            group.forEach((reply) => {
                                fullForums[reply.id].replys.push(reply);
                            });
                        });

                        promises = [];

                        Object.keys(fullForums).forEach((f) => {
                            promises.push(db.rowsByField("users", "id", fullForums[f].post.user));
                        });

                        Promise.all(promises).then(function(users) {

                            var subjects = [];

                            users.forEach(function(u) {
                                Object.keys(fullForums).forEach((f) => {
                                    if (fullForums[f].post.user == u[0].id) {
                                        fullForums[f].user = u[0];
                                    }
                                    if (!subjects.includes(fullForums[f].post.subject)) {
                                        subjects.push(fullForums[f].post.subject);
                                    }
                                });
                            });

                            resolve({fullForums, subjects});
                            return;

                        }, function(err) {
                            reject(err);
                            return;
                        });

                    }, function(err) {
                        reject(err);
                        return;
                    });

                    return;
                }, function(err) {
                    reject("unable to get all posts: "+err);
                    return;
                });
            });
        };

        return {
            newPost:function(userId, title, body, subject){
                return newPost(db, userId, title, body, subject);
            },
            newReply:function(postId, userId, body){
                return newReply(db, postId, userId, body);
            },
            getForumsByUser:function(userId){
                return getForumsByUser(db, userId);
            },
            getForumsBySubject:function(subject){
                return getForumsBySubject(db, subject);
            },
            getAllPosts:function(){
                return getAllPosts(db);
            },
            getPost:function(postId){
                return getPost(db, postId);
            },
        }

    }());
}
