window.document.onload = function(){
    var user_script_container = document.getElementById("user-script-container")
    user_script_container.selectionIndex = 0
    }

    var submitCode = function(){
    document.getElementById("submitButton").style.visibility = "hidden";
    document.getElementById("loader").style.visibility = "visible";
    var user_script_container = ace.edit("editor");
    httpPostAsync("/challenge_request", user_script_container.getValue())
        .then(json_response => {
            console.log("response!" + json_response);
            document.getElementById("loader").style.visibility = "hidden";
            document.getElementById("submitButton").style.visibility = "visible";
            document.getElementById("response").innerHTML = "This answer is: " + json_response;
        })
    }

    function onkd(e) {
    var tab_keycode = 9
    if (e.keyCode == tab_keycode){
        e.preventDefault();
        e.stopPropagation();
    }
}