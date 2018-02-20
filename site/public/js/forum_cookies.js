window.onload = function(){
    // On click set sessionCookie
    var loginTab = document.getElementById("login");
    loginTab.onclick = function(){
        setCookie("session", "VALUE", 3);
    }

    // On window load get cookie "session"
    var sessionCookieValue = getCookie("session")
    console.log(sessionCookieValue)


    //Set category select handler
    var category_select = document.getElementById("category-select")
    category_select.onchange = function(){
        location.href = "/" + category_select.options[category_select.selectedIndex].value;
    }
}


