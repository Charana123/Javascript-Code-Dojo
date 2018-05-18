var submitSignup = function() {
    var username = document.getElementById("uname").value;
    var email = document.getElementById("email").value;
    var pass1 = document.getElementById("pass1").value;
    var pass2 = document.getElementById("pass2").value;
    var captcha = document.getElementById("g-recaptcha-response").value;

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
