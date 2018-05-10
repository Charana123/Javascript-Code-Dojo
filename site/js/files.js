var bluebird = require("bluebird")
// var fs = bluebird.promisifyAll(require("fs"))
var fs = require("fs")
var ejs = require("ejs")

var files = function(){

}

files.writeFile = function(filename, data){
    // fs.writeFileAsync(filename, data)
    //     .then(value => {

    //     })
    //     .catch(err => {
    //         console.log(err.message)
    //     })
    fs.writeFile(filename, data, function(err){
        if(err){
            console.log(err.message)
        }
    })
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
    return new Promise(function(resolve, reject) {

        getDataFunction().then(function(data) {
            ejs.renderFile(EJSfile, data, function(err, contentHTML){
                if(!err) {
                    resolve(contentHTML);
                    return;
                }

                reject(err);
            });

        }, function(err) {
            reject(err);
        });
    });
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
