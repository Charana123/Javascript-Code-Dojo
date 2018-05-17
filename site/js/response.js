"use strict"

const CHALLENGES_NUM = 6;
const files = require("./files.js")
const https = require("https");

const secretKey = "6LcLE1kUAAAAAPoRl_vsA0abLIieJxQc1Rz-GkbQ"
const captchaUrl = "https://www.google.com/recaptcha/api/siteverify"

var nothingFunctionOut = function(request) {
    return new Promise(function(resolve, reject) {
        var data = {};
        resolve(data);
    });
};

var nothingFunctionIn = function(request) {
    return new Promise(function(resolve, reject) {
        var data = {};
        resolve(data);
    });
};

var signInPreFunc = function(request, server) {
    return new Promise(function(resolve, reject) {
        request.on('data', chunk => {
            var [username, password] = chunk.toString().split('&');
            username = username.split('=')[1];
            password = password.split('=')[1];

            server.userHandler.signIn(username, password).then((user) => {
                var userCookie = request.headers["cookie"];
                if (userCookie.indexOf(';') > -1) {
                    userCookie = userCookie.substr(0, userCookie.indexOf(';'));
                }

                user.cookie = userCookie;
                server.UserSessions[userCookie] = user;

                resolve(user);
                return;

            }).catch((err) => {
                reject(err);
                return;

            });
        });
    });
};

var errorFunc = function(err) {
    return new Promise(function(resolve, reject) {
        var error = {err};
        resolve(error);
    });
};

var signUpPreFunc = function(request, server) {
    return new Promise(function(resolve, reject) {
        request.on('data', chunk => {
            var [username, email, pass1, pass2, captcha] = chunk.toString().split('&');
            email = email.split('=')[1].replace("%40", "@");
            username = username.split('=')[1];
            pass1 = pass1.split('=')[1];
            pass2 = pass2.split('=')[1];
            captcha = captcha.split('=')[1];

            https.get(captchaUrl+"?secret="+secretKey+"&response="+captcha, (res) => {
                res.on('data', (d) => {
                    d = JSON.parse(d.toString());
                    if (d.success) {
                        server.userHandler.signUp(email, username, pass1, pass2).then(function(user) {
                            var userCookie = request.headers["cookie"];
                            if (userCookie.indexOf(';') > -1) {
                                userCookie = userCookie.substr(0, userCookie.indexOf(';'));
                            }
                            user.cookie = userCookie;
                            server.UserSessions[userCookie] = user;
                            resolve(user);
                            return;

                        }).catch((err) => {
                            reject(err.message);
                            return;

                        });
                    } else  {
                        reject("invalid captcha response from client");
                        return;
                    }
                });

            }).on('error', (err) => {
                reject(err);
                return;
            });
        });
    });
};

var questionsAndUserProgress = function(userId, server) {
    return new Promise(function(resolve, reject) {
        server.questionsHandler.getAllQuestions().then(function(questions) {
            server.challengeHandler.challengesByUser(userId).then(function(challenges) {
                for (var i = 0; i < CHALLENGES_NUM; i++) {
                    questions[i].complete = challenges[i];
                }
                resolve(questions);
                return;
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

var challengeRequest = function(docker, id, request, response) {
    return new Promise(function(resolve, reject) {
        request.on("data", (data) => {
            data = data.toString("utf-8");
            files.writeFile("docker/task.js", data);
            docker.tryAnswer("docker/.", "docker/task.js", "docker/output", "docker/answers/"+id).then(function(ans) {
                console.log("server got: " + ans);
                if (ans == true) {
                    ans = "correct!";
                } else {
                    ans = "incorrect!";
                }

                resolve({"ans": ans});
                return;
            }, function(err) {

                reject(err);
                return;
            })
        });
    });
};

var postRequest = function(postId, server) {
    return new Promise(function(resolve, reject) {
        server.forumHandler.getPost(postId).then(function(post) {
            resolve(post);
        }, function(err) {
            reject(err);
        });
    });
};

var uploadUserImage = function(userId, request, server) {
    return new Promise(function(resolve, reject) {

        var data = "";
        request.on('data', function (chunk) {
          if(!(chunk == undefined)) data += chunk;
        });

        request.on('end', function () {
            server.userHandler.uploadImage(userId, data).then(function(res) {
                var userCookie = request.headers["cookie"];
                var user = server.UserSessions[userCookie];
                user.image = res;
                resolve(user);
            }, function(err) {
                reject(err);
            });
        });
    });
};

var replySubmission = function(request, userId, server) {
    return new Promise(function(resolve, reject) {
        request.on('data', data => {
            data = data.toString("utf-8");
            var [reply, postId] = data.toString().split('&');
            // We need to format this reply with the special characters
            reply = reply.split('=')[1];
            postId = postId.split('=')[1];

            server.forumHandler.newReply(postId, userId, reply).then(function(res) {
                resolve(res);
            }, function(err) {
                reject(err);
            });
        });
    });
};

var newPostSubmission = function(request, userId, server) {
    return new Promise(function(resolve, reject) {
        request.on('data', data => {
            data = data.toString("utf-8");
            //"subject=This+is+a+subject&title=This+is+a+title&body=This+is+a+body"
            var [subject, title, body] = data.toString().split('&');
            // We need to format this reply with the special characters
            subject = subject.split('=')[1].replace(/\+/g, " ");
            title = title.split('=')[1].replace(/\+/g, " ");
            body = body.split('=')[1].replace(/\+/g, " ");

            server.forumHandler.newPost(userId, title, body, subject).then(function(res){
                resolve(res);
            }, function(err) {
                reject(err);
                return;
            });
        });
    });
};

module.exports = {
    nothingFunctionOut: nothingFunctionOut,
    nothingFunctionIn: nothingFunctionIn,
    signInPreFunc: signInPreFunc,
    signUpPreFunc: signUpPreFunc,
    errorFunc: errorFunc,
    questionsAndUserProgress: questionsAndUserProgress,
    challengeRequest: challengeRequest,
    uploadUserImage: uploadUserImage,
    postRequest: postRequest,
    replySubmission: replySubmission,
    newPostSubmission: newPostSubmission,
}
