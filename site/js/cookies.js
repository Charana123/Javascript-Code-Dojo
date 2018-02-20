

var cookies = function(){

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