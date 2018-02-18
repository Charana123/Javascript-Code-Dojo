var port = 8080;
var verbose = true;

var http = require("http");
var fs = require("fs");
var ejs = require("ejs")
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

// Serve a request by delivering a file.
function handle(request, response) {
    //get the URL with type or no type, if no type add .html type
    //
    var url = request.url.toLowerCase();
    if(url == "/forum"){
        return forum;
    }



    if (url.endsWith("/")) url = url + "index.html";
    if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
    var type = findType(url);
    if (type == null) return fail(response, BadType, "File type unsupported");
    var file = "./public" + url;
    
    //give file with .html extension to promise
    //promise will check if extension is .html and check for .ejs version
    //if .html version doesn't exist or extension is not .html 
    //fallback on default readFile handler
    var readFileEJS = function(file){
        return new Promise(function(resolve, reject){
            var lastIndex = file.lastIndexOf(".")
            var extension = file.substring(lastIndex + 1)
            if(extension === "html"){
                ejsFile = file.substring(0, lastIndex) + ".ejs";
                fs.readFile(ejsFile, function(err, content){
                    if(err) reject(err)
                    else resolve(content)
                })
            }
            else reject(new Error("Resource not HTTP file"))
        })
    }
    var readFile = function(err){
        return new Promise(function(resolve, reject){
            fs.readFile(file, function(err, content){
                if(err) reject(err)
                else resolve(content)
            })
        })
    }
    var resolveEJS = function(content){
        ejs.render()
    }
    var resolveHTML = function(content){

    }
    var err = function(err){
        fail(response, NotFound, "File not found");
    }
    // if (err) return fail(response, NotFound, "File not found");
    // var typeHeader = { "Content-Type": type };
    // response.writeHead(OK, typeHeader);
    // response.write(content);
    // response.end();

    //readFile returns  
    fs.readFile(file, ready);
    function ready(err, content) { deliver(response, type, err, content); }
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
function deliver(response, type, err, content) {
    if (err) return fail(response, NotFound, "File not found");
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
        ejs : "application/xhtml+xml",
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
