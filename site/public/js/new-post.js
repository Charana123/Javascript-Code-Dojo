var submitPost = function() {
    var subject = document.getElementById("subject").value;
    var title = document.getElementById("title").value;
    var body = document.getElementById("body").value;
    var captcha = document.getElementById("captcha").value;

    var sendData = "subject="+subject+"&title="+title+"&body="+body+"&captcha="+captcha;

    httpPostAsync("/new_post_submission", sendData)
        .then(res => {
            if (res.indexOf("<") == -1) {
                var json = JSON.parse(res);
                if (json.isErr) {
                    document.getElementById("captcha-error").textContent = "* " + json.message;
                }
            } else {
                window.location.href = 'forum';
            }
        });
}
