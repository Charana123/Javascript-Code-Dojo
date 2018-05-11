"use strict"

const crypto = require('crypto');



module.exports = {
    Cookies: Cookies
};

function Cookies() {
    return (function() {

        var cookies = [];

        function generateCookie() {
            return new Promise(function(resolve, reject) {
                crypto.randomBytes(64, function(err, buffer) {
                    if (err) {
                        reject(err);
                    }

                    var token = buffer.toString('hex');
                    var exdate = new Date();
                    exdate.setDate(exdate.getDate() + 1);

                    resolve("cookie="+token+";expires"+exdate.toUTCString()+";");
                });
            });
        };

        var setCookie = function(response, cookie) {
            return new Promise(function(resolve) {
                var exdate = new Date();
                exdate.setDate(exdate.getDate() + 1);

                cookie = cookie + ";expires"+exdate.toUTCString()+";";
                response.setHeader('Set-Cookie', [cookie])

                resolve(response);
                return;
            });
        };

        var getCookie =  function(request) {
            return new Promise(function(resolve, reject){

                // if cookie exists in request we can use that
                if (request.headers["cookie"]) {
                    resolve(request.headers["cookie"]);
                }

                generateCookie().then(function(cookie) {
                    resolve(cookie);

                }, function(err) {
                    reject(err);
                });
            });
        };


        return  {
            setCookie:function(response, cookie_name, value, exdays) {
                return setCookie(response, cookie_name, value, exdays);
            },
            getCookie:function(request, cookie_name){
                return getCookie(request, cookie_name);
            }
        }
    }() );
}
