var bluebird = require("bluebird")
var fs = require("fs")
var ejs = require("ejs")

var files = function(){

}

files.writeFile = function(filename, data){
    fs.writeFile(filename, data, function(err){
        if(err){
            console.log(err)
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

files.readEJSFile = function(uri, getDataFunction, response, user){
    var EJSfile = "./public" + uri + ".ejs";
    return new Promise(function(resolve, reject) {

        getDataFunction.then(function(data) {
            var clientData = {};
            clientData.data = data;
            if (user) {
                clientData.session_valid = true;
                clientData.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    image: user.image
                };
            } else {
            clientData.session_valid = false;
                clientData.user = {};
            }


            console.log("clientData: " + JSON.stringify(clientData));
            ejs.renderFile(EJSfile, clientData, function(err, contentHTML){
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
