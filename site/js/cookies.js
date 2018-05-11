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

        var setCookie = function(response, cookie_name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            var cookie = cookie_name + "=" + c_value;
            response.setHeader('Set-Cookie', [cookie])
        };

        var getCookie =  function(request, cookie_name){
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
