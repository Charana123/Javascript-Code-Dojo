window.addEventListener("load", function(){
    var profile_icon_button = document.getElementById("profile-image");
    profile_icon_button.onclick = function(){
        var user_options_popup = document.getElementById("user-options-popup");
        user_options_popup.style.display = "block";
    }
    var transparent_black_background = document.getElementById("transparent-black-background");
    transparent_black_background.addEventListener("click", function(){
        var user_options_popup = document.getElementById("user-options-popup");
        user_options_popup.style.display = "none";
        var login_popup = document.getElementById("login-form-popup");
        login_popup.style.display = "none";
    })
    var login_button = document.getElementById("login-button");
    login_button.onclick = function(){
        var login_popup = document.getElementById("login-form-popup");
        login_popup.style.display = "block";
    }
});
