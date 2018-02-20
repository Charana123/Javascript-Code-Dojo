var port = 8080;
var verbose = true;

var http = require("http");
var fs = require("fs")
var forum = require("./database/forum")
var files = require("./js/files.js")
var cookies = require("./js/cookies.js")
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;
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
    if (ok) path = "./public/index.html";
    if (ok) ok = fs.existsSync(path);
    if (!ok) console.log("Can't find", path);
    return ok;
}


var loadEJSelseHTML = function(request, uri, EJSData, response){
    cookies.getCookie(request, "session")
        .then(files.readEJSFile(uri, EJSData, response))
        .catch(files.readHTMLFile(uri))
        .then(function(contentHTML){
            console.log("sending HTML")
            var type = types["html"]
            deliver(response, type, contentHTML)
        })
        .catch(function(err){
            console.log("error failure")
            fail(response, NotFound, err.message)
        })
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();
    if (url.endsWith("/")) url = url + "index.html";

    //Handles file that are EJS or HTML
    if(url.lastIndexOf(".") == -1){
        if(url === "/forum") loadEJSelseHTML(request, url, forum.getAllPostsData(), response)
        if(url === "/top") loadEJSelseHTML(request, url, forum.getTopPostsData(), response)
        if(url === "/new") loadEJSelseHTML(request, url, forum.getNewPostsData(), response)
        if(url === "/hot") loadEJSelseHTML(request, url, forum.getHotPostsData(), response)

        if(url === "/general") loadEJSelseHTML(request, url, forum.getAllPostsData(), response)
        if(url === "/challenge1") loadEJSelseHTML(request, url, forum.getAllPostsData(), response)
        return
    }

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
