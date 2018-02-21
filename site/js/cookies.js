

var cookies = function(){

}


cookies.setCookie = function(response, cookie_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    var cookie = cookie_name + "=" + c_value;
    response.setHeader('Set-Cookie', [cookie])
}


cookies.getCookie =  function(request, cookie_name){
    return new Promise(function(resolve, reject){
        var cookies = request.headers["cookie"].split(";")
        for(var cookie of cookies){
            var key = cookie.substr(0, cookie.indexOf("="))
            if(key === cookie_name){
                var value = cookie.substr(cookie.indexOf("=")+1)
                console.log("session: " + value)
                resolve(value)
                return
            }
        }
        console.log("no session cookie")
        reject()
    })
}

module.exports = cookies