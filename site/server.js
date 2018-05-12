"use strict"

var port = 8080;
var verbose = true;

var http = require("http");
var fs = require("fs")
var forum = require("./database/forum.js")
var userApi = require("./database/user.js")
var files = require("./js/files.js")
var cookies = require("./js/cookies.js").Cookies();
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;

var docker = require("./docker/check_answer.js").newDockerChecker();

const dbName = "./database/db.sqlite3";
var db = require("./database/database_api.js").newDatabase(dbName);
var userHandler;
db.ensure().then((value) => {
    console.log("Database ensured");
    userHandler = userApi.UserHandler(db);
}).catch((err) => {
    console.log("error: "+ err);
});

var UserSessions = {};

start();

// Start the http service. Accept only requests from localhost, for security.
function start() {
    if (!checkSite()) return;
    types = defineTypes();
    banned = [];
    banUpperCase("./public/", "");
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80) address = address + ":" + port;
    console.log("Server running at", address);
}

// Check that the public folder and index.html page exist.
function checkSite() {
    var path = "./public";
    var ok = fs.existsSync(path);
    return ok;
}


function loadEJS(request, uri, loginFunction, defaultFunction, response){
    cookies.getCookie(request).then(function(cookie) {

        if (UserSessions[cookie]) {
            console.log(JSON.stringify(UserSessions));

            files.readEJSFile(uri, loginFunction, response, UserSessions[cookie]).then(function(contentHTML) {
                var type = types["html"]
                cookies.setCookie(response, cookie).then(function(response) {
                    deliver(response, type, contentHTML)
                });

            }, function(err) {
                console.log("failed to read ejs file: "+err);
            });

        } else {

            files.readEJSFile(uri, defaultFunction, response).then(function(contentHTML) {
                var type = types["html"]
                cookies.setCookie(response, cookie).then(function(response) {
                    deliver(response, type, contentHTML)
                });

            }, function(err) {
                console.log("failed to read ejs file: "+err);
            });

        }

    }, function(err) {
        console.log("failed to load EJS: " + err);
    });
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();

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
                console.log(file)
                if (err) return fail(response, NotFound, "File not found");
            })

        return;
    }

    var loginFunc = function(){};
    var defaultFunc = function(){};
    var preFunc = null;

    switch (url) {

        case "/index":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/sign-up":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/challenges":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/games":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/snake":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/tetris":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/asteroids":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;


        case "/login":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/forum":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            break;

        case "/new":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "forum";
            break;

        case "/top":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "forum";
            break;

        case "/hot":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "forum";
            break;

        case "/general":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "forum";
            break;

        case "/challenge1":
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "forum";
            break;

            //case "/challenge_request":
            //    request.on("data", (data) => {
            //        data = data.toString("utf-8");
            //        files.writeFile("docker/task.js", data);
            //        docker.tryAnswer("docker/.", "docker/task.js", "docker/output", "docker/answers/fib100").then(function(ans) {
            //            console.log("server got: " + ans);
            //            if (ans == true) {
            //                ans = "correct!";
            //            } else {
            //                ans = "incorrect!";
            //            }
            //            deliver(response, types["json"], ans);
            //        }, function(err) {
            //            deliver(response, types["json"], ("error from docker: " + err));
            //        })
            //    });
            //    break;

        case "/sign-up_submission":
            preFunc = new Promise(function(resolve, reject) {
                request.on('data', chunk => {
                    var [email, username, pass1, pass2] = chunk.toString().split('&');
                    email = email.split('=')[1].replace("%40", "@");
                    username = username.split('=')[1];
                    pass1 = pass1.split('=')[1];
                    pass2 = pass2.split('=')[1];

                    var returnResult;

                    userHandler.signUp(email, username, pass1, pass2).then((res) => {

                        resolve(res);
                        return;

                    }).catch((err) => {
                        reject(err);
                        return;

                    });
                });
            });

            url = "/index";
            loginFunc = forum.getDefault;
            defaultFunc = forum.getDefault;
            break;

        case "/sign-in_submission":
            preFunc = new Promise(function(resolve, reject) {
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

            url = "/index";
            loginFunc = forum.getDefault;
            defaultFunc = forum.getDefault;
            break;

        default:
            loginFunc = forum.getAllPostsData;
            defaultFunc = forum.getDefault;
            url = "/index";

    }

    if (preFunc) {
        preFunc.then(function() {
            loadEJS(request, url, loginFunc, defaultFunc, response);
        }, function(err) {
            console.log("error occured during pre func: " + err);
        });
    } else {
        loadEJS(request, url, loginFunc, defaultFunc, response);
    }

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

function hello() {
    console.log("Hello");
}
