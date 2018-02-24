"use strict"

var cmd = require("node-cmd");
var Promise = require('bluebird');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd })
const foo = newDockerChecker();

module.exports = {
    newDockerChecker: newDockerChecker
};

function newDockerChecker() {
    return (function() {
        var dockerBuild = function() {
            return new Promise(function(resolve, reject) {
                getAsync('docker build -t mynode .').then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
            });
        };

        var dockerRun = function() {
            return new Promise(function(resolve, reject) {
                getAsync('docker run mynode').then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
            });
        };

        var dockerCopy = function() {
            return new Promise(function(resolve, reject) {
                getAsync('docker cp $(docker ps -l -q):/output .').then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err)
                });
            });
        };

        var compareFiles = function(file1, file2) {
            return new Promise(function(resolve, reject) {
                getAsync('cmp --silent ' + file1 + ' ' + file2 + ' || echo "files are different"').then(data => {
                    if (data[0] != "") {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    resolve(err);
                });
            });
        };

        return {
            build:function() {
                return dockerBuild();
            },
            run:function() {
                return dockerRun();
            },
            cp:function() {
                return dockerCopy();
            },
            cmpfiles:function(file1, file2) {
                return compareFiles(file1, file2);
            },
        }


    }());
}

foo.build().then(function(data) {
    foo.run().then(function(data) {
        foo.cp().then(function(data) {
            foo.cmpfiles("answers/fib100", "output").then(function(data) {
                console.log(data);
            }, function(err) {
                console.log(err);
                return;
            });
        }, function(err) {
            console.log(err);
            return;
        });
    }, function(err) {
        console.log(err);
        return;
    });
}, function(err) {
    console.log(err);
    return;
});
