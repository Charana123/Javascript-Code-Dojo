"use strict"

const secretKey = "6LcLE1kUAAAAAPoRl_vsA0abLIieJxQc1Rz-GkbQ"
const captchaUrl = "https://www.google.com/recaptcha/api/siteverify"

var port = 8080;
var verbose = true;

var https = require("https");
var fs = require("fs")

var options = {
    key: fs.readFileSync("./secrets/server.key"),
    cert: fs.readFileSync("./secrets/server.crt"),
};

var files = require("./js/files.js")
var cookies = require("./js/cookies.js").Cookies();
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;

var docker = require("./docker/check_answer.js").newDockerChecker();

const dbName = "./secrets/db.sqlite3";
var db = require("./database/database_api.js").newDatabase(dbName);
var userHandler;
var challengeHandler;
var forumHandler;
var questionsHandler;

const CHALLENGES_NUM = 6;

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

db.ensureTables().then((value) => {
    sleep(500).then(() => {
        db.ensureQuestions().then((value) => {
            db.dummyForum().then((value) => {
                userHandler = require("./database/user.js").UserHandler(db);
                challengeHandler = require("./database/challenges.js").ChallengesHandler(db);
                forumHandler = require("./database/forum.js").ForumHandler(db);
                questionsHandler = require("./database/questions.js").QuestionsHandler(db);
                console.log("Database ensured");


            }).catch((err) => {
                console.log("error: "+err);
            });

        }).catch((err) => {
            console.log("error: "+ err);
        });
    });
}).catch((err) => {
    console.log("error: "+ err);
});


var UserSessions = {};

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

var signInPreFunc = function(request) {
    return new Promise(function(resolve, reject) {
        request.on('data', chunk => {
            var [username, password] = chunk.toString().split('&');
            username = username.split('=')[1];
            password = password.split('=')[1];

            userHandler.signIn(username, password).then((user) => {
                var userCookie = request.headers["cookie"];
                user.cookie = userCookie;
                UserSessions[userCookie] = user;

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

var signUpPreFunc = function(request) {
    return new Promise(function(resolve, reject) {
        request.on('data', chunk => {
            var [username, email, pass1, pass2, captcha] = chunk.toString().split('&');
            email = email.split('=')[1].replace("%40", "@");
            username = username.split('=')[1];
            pass1 = pass1.split('=')[1];
            pass2 = pass2.split('=')[1];
            //captcha = captcha.split('=')[1];

            //https.get(captchaUrl+"?secret="+secretKey+"&response="+captcha, (res) => {
            //    res.on('data', (d) => {
            //        d = JSON.parse(d.toString());
            //        if (d.success) {
            userHandler.signUp(email, username, pass1, pass2).then(function(user) {
                var userCookie = request.headers["cookie"];
                user.cookie = userCookie;
                UserSessions[userCookie] = user;
                resolve(user);
                return;

            }).catch((err) => {
                reject(err.message);
                return;

            });
            //    } else  {
            //        reject("invalid captcha response from client");
            //        return;
            //    }
            //});

        }).on('error', (err) => {
            reject(err);
            return;
        });
        //});
    });
};

var questionsAndUserProgress = function(questionsHandler, userId) {
    return new Promise(function(resolve, reject) {
        questionsHandler.getAllQuestions().then(function(questions) {
            challengeHandler.challengesByUser(userId).then(function(challenges) {
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
}

start();

// Start the http service. Accept only requests from localhost, for security.
function start() {
    if (!checkSite()) return;
    types = defineTypes();
    banned = [];
    banUpperCase("./public/", "");
    var service = https.createServer(options, handle);
    service.listen(port, "localhost");
    var address = "https://localhost";
    if (port != 8080) address = address + ":" + port;
    console.log("Server running at", address);
}

// Check that the public folder and index.html page exist.
function checkSite() {
    var path = "./public";
    var ok = fs.existsSync(path);
    return ok;
}


function loadEJS(request, uri, loginFunction, defaultFunction, response, cookie) {
    uri = "/" + uri;
    var readEJSFile = function(uri, dataFunction, response, userObject){

        files.readEJSFile(uri, dataFunction, response, userObject)
            .then(function(contentHTML) {
                var type = types["html"]
                cookies.setCookie(response, cookie).then(function(response) {
                    deliver(response, type, contentHTML)
                });
            })
            .catch(function(err) {
                console.log("failed to read ejs file: "+err);
            });
    };

    if (UserSessions[cookie]) {
        console.log(JSON.stringify(UserSessions));
        readEJSFile(uri, loginFunction, response, UserSessions[cookie]);
    } else {
        readEJSFile(uri, defaultFunction, response);
    }
}

// Serve a request by delivering a file.
function handle(request, response) {

    var url = decodeURIComponent(request.url.toString('utf-8'));
    url = url.toLowerCase();

    if (url.endsWith("/") || url == "localhost:8080" || url == "127.0.0.1:8080") {
        url = "/index";
    }

    //Handles file that are EJS or HTML
    if(url.lastIndexOf(".") != -1){
        //Handling files that are NOT EJS or HTML (.js, .svg etc.)
        if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
        var type = findType(url);
        if (type == null) return fail(response, BadType, "File type unsupported");
        var file = "./public" + url;

        files.readFile(file)
            .then(function(content){
                deliver(response, type, content);
            })
            .catch(function(err){
                if (err) return fail(response, NotFound, "File not found");
            })

        return;
    }

    var resolveUrl = function(url, request, userId, response) {
        return new Promise(function(resolve) {

            var loginFunc = function(){};
            var defaultFunc = function(){};
            var preFunc = false;
            var errorUrl = "";
            if (url[0] == '/') {
                url=url.substring(1);
            }

            var rest;
            [url, rest] = url.split("/");

            switch (url) {
                case "index":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;

                case "sign-up":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;

                case "challenges":
                    loginFunc = questionsAndUserProgress(questionsHandler, userId);
                    defaultFunc = questionsHandler.getAllQuestions();
                    break;

                case "snake":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;

                case "tetris":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;

                case "asteroids":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;


                case "login":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    break;

                case "forum":
                    loginFunc = forumHandler.getAllPosts();
                    defaultFunc = forumHandler.getAllPosts();
                    break;

                case "new":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    url = "forum";
                    break;

                case "top":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    url = "forum";
                    break;

                case "hot":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    url = "forum";
                    break;

                case "general":
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    url = "forum";
                    break;

                case "editor":
                    loginFunc = questionsHandler.getQuestion(rest);
                    defaultFunc = questionsHandler.getQuestion(rest);
                    url="editor";
                    break;

                case "sign-up_submission":
                    preFunc = signUpPreFunc(request);
                    url = "index";
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    errorUrl = "sign-up";
                    break;

                case "sign-in_submission":
                    preFunc = signInPreFunc(request);
                    url = "index";
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    errorUrl = "login";
                    break;

                case "challenge_request":
                    loginFunc = challengeRequest(docker, rest, request, response);
                    defaultFunc = challengeRequest(docker, rest, request, response);
                    url="editor";
                    errorUrl = "challenges";
                    break;

                default:
                    loginFunc = nothingFunctionIn(request);
                    defaultFunc = nothingFunctionOut(request);
                    url = "index";
            }

            resolve([url, loginFunc, defaultFunc, preFunc, errorUrl]);
        });
    };

    cookies.getCookie(request).then(function(cookie) {
        var userId = 0;
        if (UserSessions[cookie]) {
            userId = UserSessions[cookie].id;
        }

        resolveUrl(url, request, userId, response).then(function(res) {
            var [url, loginFunc, defaultFunc, preFunc, errorUrl] = res;

            if (preFunc) {
                preFunc.then(function() {
                    loadEJS(request, url, loginFunc, defaultFunc, response, cookie);
                    return;

                }, function(err) {
                    console.log("error occured during pre func: " + err);
                    url = errorUrl;
                    loadEJS(request, url, errorFunc(err), errorFunc(err), response, cookie);
                    return;
                });

            } else {
                loadEJS(request, url, loginFunc, defaultFunc, response, cookie);
                return;
            }
        }, function(err) {
            console.log("failed to load EJS: " + err);
            return;
        });
    });

    return
}

// Forbid any resources which shouldn't be delivered to the browser.
function isBanned(url) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b)) return true;
    }
    return false;
}

// Find the content type to respond with, or undefined.
function findType(url) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, content) {
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i=0; i<names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase()) {
            if (verbose) console.log("Banned:", file);
            banned.push(file.toLowerCase());
        }
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}

function defineTypes() {
    var types = {
        html : "application/xhtml+xml",
        css  : "text/css",
        js   : "application/javascript",
        mjs  : "application/javascript", // for ES6 modules
        png  : "image/png",
        gif  : "image/gif",    // for images copied unchanged
        jpeg : "image/jpeg",   // for images copied unchanged
        jpg  : "image/jpeg",   // for images copied unchanged
        svg  : "image/svg+xml",
        json : "application/json",
        pdf  : "application/pdf",
        txt  : "text/plain",
        ttf  : "application/x-font-ttf",
        woff : "application/font-woff",
        aac  : "audio/aac",
        mp3  : "audio/mpeg",
        mp4  : "video/mp4",
        webm : "video/webm",
        ico  : "image/x-icon", // just for favicon.ico
        xhtml: undefined,      // non-standard, use .html
        htm  : undefined,      // non-standard, use .html
        rar  : undefined,      // non-standard, platform dependent, use .zip
        doc  : undefined,      // non-standard, platform dependent, use .pdf
        docx : undefined,      // non-standard, platform dependent, use .pdf
    }
    return types;
}
