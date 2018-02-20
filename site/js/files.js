var fs = require("fs");
var ejs = require("ejs")

var files = function(){

}

files.readFile = function(file){
    return new Promise(function(resolve, reject){
        fs.readFile(file, function(err, content){
            if(!err) resolve(content)
            else reject(err)
        })
    })
}

files.readEJSFile = function(uri, getDataFunction, response){
    var EJSfile = "./public" + uri + ".ejs";
    return function(user_id){
        console.log("user_id: " + user_id)
        //use user_id to query from database
        var renderEJS = function(data){
            return new Promise(function(resolve, reject){
                ejs.renderFile(EJSfile, data, function(err, contentHTML){
                    if(!err) resolve(contentHTML)
                    else reject(err)
                })
            })
        }
        return getDataFunction().then(renderEJS)
    }
}

files.readHTMLFile = function(uri){
    var HTMLfile = "./public" + uri + ".html";
    return function(err){
        return new Promise(function(resolve, reject){
            fs.readFile(HTMLfile, function(err, contentHTML){
                if(!err) resolve(contentHTML)
                else reject(err)
            })
        })
    }
}

module.exports = files;