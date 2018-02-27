"use strict"

var cmd = require("node-cmd");
var Promise = require('bluebird');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd })
//const foo = newDockerChecker();

module.exports = {
    newDockerChecker: newDockerChecker
};

function newDockerChecker() {
    return (function() {
        var dockerBuild = function(path) {
            return new Promise(function(resolve, reject) {
                getAsync('docker build -t mynode ' + path).then(data => {
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

        var dockerCopy = function(path) {
            return new Promise(function(resolve, reject) {
                getAsync('docker cp $(docker ps -l -q):/output ' + path).then(data => {
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
            build:function(path) {
                return dockerBuild(path);
            },
            run:function() {
                return dockerRun();
            },
            cp:function() {
                return dockerCopy(path);
            },
            cmpfiles:function(file1, file2) {
                return compareFiles(file1, file2);
            },
            tryAnswer:function(dockerPath, userJsFile, outputFile, answerFile) {
                dockerBuild(dockerPath).then(function(data) {
                    dockerRun().then(function(data) {
                        dockerCopy(outputFile).then(function(data) {
                            compareFiles(answerFile, outputFile).then(function(data) {
                                console.log("Answer was: " + data);
                                return data;
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

            }

        }


    }());
}

//foo.build().then(function(data) {
//    foo.run().then(function(data) {
//        foo.cp().then(function(data) {
//            foo.cmpfiles("answers/fib100", "output").then(function(data) {
//                console.log(data);
//            }, function(err) {
//                console.log(err);
//                return;
//            });
//        }, function(err) {
//            console.log(err);
//            return;
//        });
//    }, function(err) {
//        console.log(err);
//        return;
//    });
//}, function(err) {
//    console.log(err);
//    return;
//});
