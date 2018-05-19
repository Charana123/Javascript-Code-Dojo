"use strict"

const CHALLENGES_NUM = 6;
const files = require("./files.js")
const fs = require("fs")
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

var captcha = function(server, request) {
    return new Promise(function(resolve, reject) {
        var options = {
            size: 8,
            ignoreChars: '0o1i',
            noise: 2,
            color: true,
            background:'#cc9966',
        };
        var captcha = server.offlineCaptcha.create(options);
        console.dir(captcha);
        server.UserSessions[request.headers["cookie"]].captcha = captcha.text;
        resolve(captcha.data);
        return;
    });
};

var newPostSubmission = function(request, userId, server) {
    return new Promise(function(resolve, reject) {
        request.on('data', chunk => {
            var [subject, title, body, captcha] = chunk.toString().split('&');
            subject = subject.split('=')[1];
            title = title.split('=')[1];
            body = body.split('=')[1];
            captcha = captcha.split('=')[1];

            var err = {isErr: false, message: ""};
            if (subject == "") {
                err.isErr = true;
                err.message += "Subject is blank\n";
            }

            if (title == "") {
                err.isErr = true;
                err.message += "Title is blank\n";
            }

            if (body == "") {
                err.isErr = true;
                err.message += "Body is blank\n";
            }

            if (captcha != server.UserSessions[request.headers["cookie"]].captcha) {
                err.isErr = true;
                err.message += "incorrect captcha\n";
            }

            if (err.isErr) {
                reject(err)
                return;
            }

            server.forumHandler.newPost(userId, title, body, subject).then(function(res){
                resolve(res);
                return;
            }, function(err) {
                err = {isErr: true, message: err};
                reject(err);
                return;
            });
        });
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

            }).catch((errMessage) => {
                var err = {isErr: true, message: errMessage};
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
                            err.iserr = true;
                            reject(err);
                            return;

                        });
                    } else  {
                        reject({message:"invalid captcha response from client", isErr:true});
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

var challengeRequest = function(server, userId, id, request, response) {
    return new Promise(function(resolve, reject) {
        var data = "";
        request.on('data', function (chunk) {
            if(!(chunk == undefined)) data += chunk;
        });

        request.on('end', function () {

            data = data.toString("utf-8");
            files.writeFile("docker/task.js", data);
            server.docker.tryAnswer("docker/.", "docker/task.js", "docker/output", "docker/answers/"+id).then(function(res) {
                var ans = res;
                console.log("server got: " + ans);
                if (ans) {
                    ans = "correct!";
                } else {
                    ans = "incorrect!";
                }

                fs.readFile('docker/output', 'utf8', function (err, content) {
                    if (err) {
                        reject({"ans": false, output: "ERROR: "+err});
                        return;
                    }
                    if(res && !(userId == 0)) {
                        server.challengeHandler.updateChallenge(userId, id-1, 1).then(function(res) {
                            resolve({"ans": ans, output: content});
                            return;

                        }, function(err) {
                            reject({"ans": false, output: "ERROR: "+err});
                            return;
                        });
                    } else {
                        resolve({"ans": ans, output: content});
                        return;
                    }
                });
            }, function(err) {

                reject({"ans": false, output: "ERROR: "+err});
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
                if (res[0] == '/') {
                    res = res.substring(1);
                }
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
    captcha: captcha,
}
