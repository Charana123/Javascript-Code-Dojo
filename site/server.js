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

var docker = require("./docker/check_answer.js").newDockerChecker();

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
                console.log("Database ensured");
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

    if (server.UserSessions[cookie]) {
        console.log(JSON.stringify(server.UserSessions));
        readEJSFile(uri, loginFunction, response, server.UserSessions[cookie]);
    } else {
        readEJSFile(uri, defaultFunction, response);
    }
}

function resolveUrl(url, request, userId, response, server) {
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
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                break;

            case "sign-up":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                break;

            case "challenges":
                loginFunc = respFuncs.questionsAndUserProgress(userId, server);
                defaultFunc = server.questionsHandler.getAllQuestions();
                break;

            case "snake":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                break;

            case "tetris":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                break;

            case "asteroids":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                break;


            case "login":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "index";
                break;

            case "forum":
                loginFunc = server.forumHandler.getAllPosts();
                defaultFunc = server.forumHandler.getAllPosts();
                break;

            case "new":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "forum";
                break;

            case "top":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "forum";
                break;

            case "hot":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "forum";
                break;

            case "general":
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "forum";
                break;

            case "editor":
                loginFunc = server.questionsHandler.getQuestion(rest);
                defaultFunc = server.questionsHandler.getQuestion(rest);
                url="editor";
                break;

            case "sign-up_submission":
                preFunc = respFuncs.signUpPreFunc(request, server);
                url = "index";
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                errorUrl = "sign-up";
                break;

            case "sign-in_submission":
                preFunc = respFuncs.signInPreFunc(request, server);
                url = "index";
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                errorUrl = "index";
                break;

            case "challenge_request":
                loginFunc = respFuncs.challengeRequest(docker, rest, request, response);
                defaultFunc = respFuncs.challengeRequest(docker, rest, request, response);
                url="editor";
                errorUrl = "challenges";
                break;

            case "image_submission":
                preFunc = respFuncs.uploadUserImage(userId, request, server);
                url = "index";
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                errorUrl = "index";
                break;

            default:
                loginFunc = respFuncs.nothingFunctionIn(request);
                defaultFunc = respFuncs.nothingFunctionOut(request);
                url = "index";
        }

        resolve([url, loginFunc, defaultFunc, preFunc, errorUrl]);
    });
};


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

    cookies.getCookie(request).then(function(cookie) {
        var userId = 0;
        if (server.UserSessions[cookie]) {
            userId = server.UserSessions[cookie].id;
        }

        resolveUrl(url, request, userId, response, server).then(function(res) {
            var [url, loginFunc, defaultFunc, preFunc, errorUrl] = res;

            if (preFunc) {
                preFunc.then(function(res) {
                    loadEJS(request, url, loginFunc, defaultFunc, response, cookie);
                    return;

                }, function(err) {
                    console.log("error occured during pre func: " + err);
                    url = errorUrl;
                    loadEJS(request, url, respFuncs.errorFunc(err), respFuncs.errorFunc(err), response, cookie);
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
