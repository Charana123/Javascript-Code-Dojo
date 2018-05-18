var submitSignin = function() {
    var username = document.getElementById("uname").value;
    var pass = document.getElementById("pass").value;

    var sendData = "uname="+username+"&pass="+pass;

    httpPostAsync("/sign-in_submission", sendData)
        .then(res => {
            console.dir(res);
            if (res.indexOf("<") == -1) {
                var json = JSON.parse(res);
                if (json.isErr) {
                    document.getElementById("login-form-error").textContent = "* " + json.message;
                }
            } else {
                window.location.href = 'index';
            }
        });
}
