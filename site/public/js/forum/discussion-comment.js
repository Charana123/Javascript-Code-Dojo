function postReply(){
    console.log("posting reply...");
    //var reply_comment_container = document.getElementById("reply-comment-container");
    //make an AJAX request for a 
    // reply_comment_container.innerHTML = 
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
    console.log("hiding...");
    var reply_box_id = replyButton.getAttribute("replyBoxID");
    console.log(reply_box_id);
    var reply_box = document.getElementById(reply_box_id);
    console.log(reply_box);
    reply_box.style.display = "none";
}
