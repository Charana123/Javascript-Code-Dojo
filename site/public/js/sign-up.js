var submitSignup = function() {
    var username = document.getElementById("uname").value;
    var email = document.getElementById("email").value;
    var pass1 = document.getElementById("pass1").value;
    var pass2 = document.getElementById("pass2").value;
    var captcha = document.getElementById("captcha").value;

    var sendData = "uname="+username+"&email="+email+"&pass1="+pass1+"&pass2="+pass2+"&captcha="+captcha;

    httpPostAsync("/sign-up_submission", sendData)
        .then(res => {
            if (res.indexOf("<") == -1) {
                var json = JSON.parse(res);
                if (json.isErr) {
                    document.getElementById("signup-error").textContent = "* " + json.message;
                }
            } else {
                window.location.href = 'index';
            }
        });
}

var newCaptcha = function() {
    httpPostAsync("/new_captcha")
        .then(res => {
            res = "<div>"+res.toString().replace(/\\/g, '')+"</div>";
            var Obj = document.getElementsByTagName('svg')[0];
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(res, "image/svg+xml");
            var str = xmlDoc.childNodes[0].innerHTML;
            str = str.substring(1, str.length-1);
            Obj.outerHTML = str;
        });
}

