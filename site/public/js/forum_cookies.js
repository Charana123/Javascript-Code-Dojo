window.onload = function(){
    // On click set sessionCookie
    var loginTab = document.getElementById("login");
    loginTab.onclick = function(){
        setCookie("session", "VALUE", 3);
    }

    // On window load get cookie "session"
    var sessionCookieValue = getCookie("session")
    console.log(sessionCookie);


    //Set category select handler
    var category_select = document.getElementById("category-select")
    category_select.onchange = function(){
        location.href = "/" + category_select.options[category_select.selectedIndex].value;
    }
}


//on load, get cookie, get user identifier, make database call to return user data
//use user data to populate webpage

