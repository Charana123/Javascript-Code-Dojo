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
                    json.message = json.message.replace(/\n/g, '. ');
                if (json.isErr) {
                    document.getElementById("captcha-error").textContent = "* " + json.message;
                }
            } else {
                window.location.href = 'forum';
            }
        });
}

var newCaptcha = function() {
    httpPostAsync("/new_captcha")
        .then(res => {
            res = "<div>"+res.toString("utf-8").replace(/\\/g, '')+"</div>";
            var Obj = document.getElementsByTagName('svg')[0]; //any element to be fully replaced
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(res, "image/svg+xml");
            Obj.outerHTML = xmlDoc.childNodes[0].innerHTML;
        });
}
