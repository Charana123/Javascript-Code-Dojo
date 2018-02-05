var cmd = require("node-cmd");
var Promise = require('bluebird');

const getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd })

getAsync('docker build -t mynode .').then(data => {
    getAsync('docker run mynode').then(data => {
        getAsync('docker cp $(docker ps -l -q):/output .').then(data => {
            getAsync('cmp --silent answer1 output || echo "files are different"').then(data => {
                if (data[0] != "") {
                    console.log("files are different!");
                } else {
                    console.log("files are the same!");
                }
            }).catch(err => {
                console.log('error:', err)
            })
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
}).catch(err => {
    console.log(err)
})
