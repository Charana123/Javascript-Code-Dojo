function postReply(){
    console.log("posting reply...");
    //var reply_comment_container = document.getElementById("reply-comment-container");
    //make an AJAX request for a 
    // reply_comment_container.innerHTML = 
}

function toggleReplies(){
    var toggle_icon = document.getElementById("discussion-comment-toggle");
    var reply_container = document.getElementById("reply-comment-container");
    if(reply_container.style.display === "none"){
        reply_container.style.display = "block";
        toggle_icon.src = "/img/minus.svg";
    }
    else {
        reply_container.style.display = "none";
        toggle_icon.src = "/img/plus.svg";
    }
}