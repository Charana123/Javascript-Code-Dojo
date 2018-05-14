"use strict"

var cmd = require("node-cmd");
var Promise = require('bluebird');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd})

const dockerBuildCmd = 'docker build -t mynode '
const dockerRunCmd = 'docker run mynode'
const dockerCpCmd = 'docker cp $(docker ps -l -q):/output '

module.exports = {
    newDockerChecker: newDockerChecker
};

function newDockerChecker() {
    return (function() {

        var dockerBuild = function(path) {
            return new Promise(function(resolve, reject) {
                console.log(dockerBuildCmd + path);
                getAsync(dockerBuildCmd + path).then(data => {
                    console.log(data);
                    resolve(data);
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
            });
        };

        var dockerRun = function() {
            return new Promise(function(resolve, reject) {
                console.log(dockerRunCmd);
                getAsync(dockerRunCmd).then(data => {
                    console.log(data);
                    resolve(data);
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
            });
        };

        var dockerCopy = function(path) {
            return new Promise(function(resolve, reject) {
                console.log(dockerCpCmd + path);
                getAsync(dockerCpCmd + path).then(data => {
                    console.log(data);
                    resolve(data);
                }).catch(err => {
                    console.log(err);
                    reject(err)
                });
            });
        };

        var compareFiles = function(file1, file2) {
            return new Promise(function(resolve, reject) {
                getAsync('cmp --silent ' + file1 + ' ' + file2 + ' || echo "files are different"').then(data => {
                    if (data[0] != "") {
                        console.log(data);
                        resolve(false);
                    } else {
                        console.log(data);
                        resolve(true);
                    }
                }).catch(err => {
                    console.log(data);
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
                return new Promise(function(resolve, reject) {
                    dockerBuild(dockerPath).then(function(data) {
                        dockerRun().then(function(data) {
                            dockerCopy(outputFile).then(function(data) {
                                compareFiles(answerFile, outputFile).then(function(data) {
                                    resolve(data);
                                }, function(err) {
                                    reject(err);
                                });
                            }, function(err) {
                                reject(err);
                            });
                        }, function(err) {
                            reject(err);
                        });
                    }, function(err) {
                        reject(err);
                    });
                });
            }

        }

    }());
}
