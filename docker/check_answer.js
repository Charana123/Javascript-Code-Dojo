var cmd = require("node-cmd");
var Promise = require('bluebird');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd })

var docker = function(){

}

docker.run = function(){
    getAsync('docker build -t mynode ../docker/.')
        .then(() => getAsync('docker run mynode'))
        .then(() => getAsync('docker cp $(docker ps -l -q):/output .'))
        .then(() => getAsync('cmp --silent answer1 output || echo "files are different"'))
        .then(data => {
            if (data[0] != "") {
                console.log("files are different!");
            } else {
                console.log("files are the same!");
            }
        })
        .catch(err => {
            console.log('error:', err.message)
        });
}

// function dockerBuild(){
//     getAsync('docker build -t mynode .').then(data => {
//         dockerRun();
//     }).catch(err => {
//         console.log(err)
//     })
// }

// function dockerRun() {
//     getAsync('docker run mynode').then(data => {
//         dockerCp();
//     }).catch(err => {
//         console.log(err)
//     });
// }

// function dockerCp() {
//     getAsync('docker cp $(docker ps -l -q):/output .').then(data => {
//         compareFiles();
//     }).catch(err => {
//         console.log(err)
//     });
// }

// function compareFiles() {
//     getAsync('cmp --silent answer1 output || echo "files are different"').then(data => {
//         if (data[0] != "") {
//             console.log("files are different!");
//         } else {
//             console.log("files are the same!");
//         }
//     }).catch(err => {
//         console.log('error:', err)
//     });
// }

module.exports = docker
