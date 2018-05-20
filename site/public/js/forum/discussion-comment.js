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
            res = "<div>"+res.toString().replace(/\\/g, '')+"</div>";
            var Obj = document.getElementsByTagName('svg')[0];
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(res, "image/svg+xml");
            var str = xmlDoc.childNodes[0].innerHTML;
            str = str.substring(1, str.length-1);
            Obj.outerHTML = str;
        });
}

function toggleReplies(event, toggle_icon){
    var reply_container_id = toggle_icon.getAttribute("replyContainerID");
    var reply_container = document.getElementById(reply_container_id);
    if(reply_container.style.display === "none"){
        reply_container.style.display = "block";
        toggle_icon.src = "/img/minus.svg";
    }
    else {
        reply_container.style.display = "none";
        toggle_icon.src = "/img/plus.svg";
    }
}

function increaseVote(post, table) {
    var sendData = "post="+post+"&table="+table;
    httpPostAsync("/increase_vote", sendData).then(res => {
            location.reload();
        })

}

function decreaseVote(post, table) {
    var sendData = "post="+post+"&table="+table;
    httpPostAsync("/decrease_vote", sendData).then(res => {
            location.reload();
        })
}

function showReplyBox(event, replyButton){
    var reply_box_id = replyButton.getAttribute("replyBoxID");
    var reply_box = document.getElementById(reply_box_id);
    reply_box.style.display = "block";
}

function hideReplyBox(event, replyButton){
    var reply_box_id = replyButton.getAttribute("replyBoxID");
    console.log(reply_box_id);
    var reply_box = document.getElementById(reply_box_id);
    console.log(reply_box);
    reply_box.style.display = "none";
}
