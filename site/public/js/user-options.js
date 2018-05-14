window.addEventListener("load", function(){
    var profile_icon_button = document.getElementById("profile-image");
    profile_icon_button.onclick = function(){
        var login_popup = document.getElementById("user-options-popup");
        login_popup.style.display = "block";
    }
    var transparent_black_background = document.getElementById("transparent-black-background");
    transparent_black_background.addEventListener("click", function(){
        var login_popup = document.getElementById("user-options-popup");
        login_popup.style.display = "none";
    })
});