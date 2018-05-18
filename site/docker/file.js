"use strict"

const cmd = require("node-cmd");
const Promise = require('bluebird');
const fs = require('fs');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd})
const runCmd = 'node docker/task.js > docker/output 2>&1'

module.exports = {
    newFileChecker: newFileChecker
};

function newFileChecker() {
    return (function() {

        var run = function(path) {
            return new Promise(function(resolve, reject) {
                getAsync(runCmd).then(data => {
                    resolve(data);
                }).catch(err => {
                    read(path).then(data => {
                        resolve(data);
                    }).catch(err => {
                        reject(err);
                    });
                });
            });
        };

        var read = function(path) {
            return new Promise(function(resolve, reject) {
                fs.readFile(path, 'utf8', function (err, content) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(content);
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
            run:function(path) {
                return run(path);
            },
            read:function() {
                return read(path);
            },
            cmpfiles:function(file1, file2) {
                return compareFiles(file1, file2);
            },
            tryAnswer:function(dockerPath, userJsFile, outputFile, answerFile) {
                return new Promise(function(resolve, reject) {
                    run(outputFile).then(function(data) {
                        read(outputFile).then(function(data) {
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
                });
            }
        }
    }());
}
