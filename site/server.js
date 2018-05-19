"use strict"

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
const respFuncs = require("./js/response.js");


var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;

const dbName = "./secrets/db.sqlite3";
var db = require("./database/database_api.js").newDatabase(dbName);

var server = {};
server.UserSessions = {};

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

db.ensureTables().then((value) => {
    sleep(500).then(() => {
        db.ensureQuestions().then((value) => {
            db.dummyForum().then((value) => {
                server.userHandler = require("./database/user.js").UserHandler(db);
                server.challengeHandler = require("./database/challenges.js").ChallengesHandler(db);
                server.forumHandler = require("./database/forum.js").ForumHandler(db);
                server.questionsHandler = require("./database/questions.js").QuestionsHandler(db);
                server.docker = require("./docker/docker.js").newDockerChecker();
                server.offlineCaptcha = require('svg-captcha');

                console.log("Database ensured");
                console.log("Building docker image");
                server.docker.build("docker/.").then(function(res) {
                    console.log("Docker image built successfully");
                }, function(err) {
                    err = "Error building docker image: "+err
                          + "\x1b[41m\x1b[36m\n>> --------------- Ian Please Read. --------------- <<"
                          + "\n>> Docker will not be used to evalutate challenges. <<"
                          + "\n>> Challenges will be checked in LOCAL FILE         <<"
                          + "\n>> userspace. Node will not be isolated and is NOT  <<"
                          + "\n>> recomended but we have included this option if   <<"
                          + "\n>> you do not have docker installed.                <<\x1b[0m"
                    console.error("\x1b[31m", err);
                    server.docker = require("./docker/file.js").newFileChecker();
                });

                var dir = './public/profile_pics';

                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }

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


    if (cookie.indexOf(';') > -1) {
        cookie = cookie.substr(0, cookie.indexOf(';'));
    }

    if (server.UserSessions[cookie]) {
        console.dir(JSON.stringify(server.UserSessions));
        readEJSFile(uri, loginFunction, response, server.UserSessions[cookie]);
    } else {
        readEJSFile(uri, defaultFunction, response);
    }
}

function resolveUrl(url, request, userId, response, server, cookie) {
    return new Promise(function(resolve) {
        var loginFunc = respFuncs.nothingFunctionIn(request);
        var defaultFunc = respFuncs.nothingFunctionOut(request);
        var preFunc = false;
        var errorUrl = "";
        var doLoad = true;
        var errLoad = true;

        if (url[0] == '/') {
            url=url.substring(1);
        }

        var rest;
        [url, rest] = url.split("/");

        switch (url) {
            case "index":
                break;

            case "sign-up":
                break;

            case "challenges":
                loginFunc = respFuncs.questionsAndUserProgress(userId, server);
                defaultFunc = server.questionsHandler.getAllQuestions();
                break;

            case "snake":
                break;

            case "tetris":
                break;

            case "asteroids":
                break;


            case "login":
                url = "index";
                break;

            // case "forum":
            //     if (rest && !(rest == "all")) {
            //         loginFunc = server.forumHandler.getForumsBySubject(rest);
            //         defaultFunc = server.forumHandler.getForumsBySubject(rest);
            //     } else {
            //         loginFunc = server.forumHandler.getAllPosts();
            //         defaultFunc = server.forumHandler.getAllPosts();
            //     }
            //     url = "forum";
            //     errorUrl = "forum";
            //     break;

            case "forum":
                loginFunc = server.forumHandler.forumTestData;
                defaultFunc = server.forumHandler.forumTestData;
                break;

            case "new":
                url = "forum";
                loginFunc = server.forumHandler.getAllPosts("time");
                defaultFunc = server.forumHandler.getAllPosts("time");
                break;

            case "top":
                url = "forum";
                loginFunc = server.forumHandler.getAllPosts("views");
                defaultFunc = server.forumHandler.getAllPosts("views");
                break;

            case "editor":
                loginFunc = server.questionsHandler.getQuestion(rest);
                defaultFunc = server.questionsHandler.getQuestion(rest);
                url="editor";
                break;

            case "sign-up_submission":
                preFunc = respFuncs.signUpPreFunc(request, server);
                url = "index";
                errorUrl = "sign-up";
                errLoad = false;
                break;

            case "sign-in_submission":
                preFunc = respFuncs.signInPreFunc(request, server);
                url = "index";
                errorUrl = "index";
                errLoad = false;
                doLoad = true;
                break;

            case "challenge_request":
                preFunc = respFuncs.challengeRequest(server, userId, rest, request, response);
                doLoad = false;
                break;

            case "image_submission":
                preFunc = respFuncs.uploadUserImage(userId, request, server);
                url = "index";
                errorUrl = "index";
                break;

            case "forum_post":
                loginFunc = respFuncs.postRequest(rest, server, cookie);
                defaultFunc = respFuncs.postRequest(rest, server, cookie);
                url = "forum_post";
                break;

            case "reply_submission":
                preFunc = respFuncs.replySubmission(request, userId, server, cookie);
                loginFunc = respFuncs.postRequest(rest, server, cookie);
                url = "forum_post";
                errorUrl = "forum_post";
                errLoad = false;
                break;

            case "new_post":
                loginFunc = respFuncs.captcha(server, cookie);
                break;

            case "new_captcha":
                preFunc = respFuncs.captcha(server, cookie);
                errLoad = false;
                doLoad = false;
                break;

            case "logout":
                delete server.UserSessions[cookie];
                url = "index";
                break;

            case "new_post_submission":
                preFunc = respFuncs.newPostSubmission(request, userId, server);
                url = "forum";
                errorUrl = "forum";
                errLoad = false;
                loginFunc = server.forumHandler.getAllPosts();
                defaultFunc = server.forumHandler.getAllPosts();
                break;

            default:
                url = "index";
        }

        resolve([url, loginFunc, defaultFunc, preFunc, errorUrl, doLoad, errLoad]);
    });
};


// Serve a request by delivering a file.
function handle(request, response) {

    var url = decodeURIComponent(request.url.toString('utf-8'));

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

    cookies.getCookie(request).then(function(cookie) {
        var userId = 0;
        if (cookie.indexOf(';') > -1) {
            cookie = cookie.substr(0, cookie.indexOf(';'));
        }
        if (server.UserSessions[cookie]) {
            userId = server.UserSessions[cookie].id;
        }

        resolveUrl(url, request, userId, response, server, cookie).then(function(res) {
            var [url, loginFunc, defaultFunc, preFunc, errorUrl, doLoad, errLoad] = res;

            if (preFunc) {
                preFunc.then(function(res) {
                    if (doLoad) {
                        loadEJS(request, url, loginFunc, defaultFunc, response, cookie);
                    } else {
                        var type = types["json"]
                        deliver(response, type, JSON.stringify(res));
                    }
                    return;

                }, function(err) {
                    console.log("error occured during pre func: " + err);
                    url = errorUrl;
                    if (errLoad) {
                        loadEJS(request, url, respFuncs.errorFunc(err), respFuncs.errorFunc(err), response, cookie);
                    } else {
                        var type = types["json"]
                        deliver(response, type, JSON.stringify(err));
                    }
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
