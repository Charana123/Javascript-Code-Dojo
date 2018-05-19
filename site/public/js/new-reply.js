var submitReply = function(id) {
    var reply = document.getElementById("reply").value;
    var postId = document.getElementById("postId").value;
    var captcha = document.getElementById("captcha").value;

    var sendData = "reply="+reply+"&postId="+postId+"&captcha="+captcha;

    httpPostAsync("/reply_submission/"+id, sendData)
        .then(res => {

            if (res.indexOf("<") == -1) {
                var json = JSON.parse(res);
                    json.message = json.message.replace(/\n/g, '. ');
                if (json.isErr) {
                    document.getElementById("captcha-error").textContent = "* " + json.message;
                }
            } else {
                location.reload();
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
