window.addEventListener("load", function(){
    // var profile_icon_button = document.getElementById("profile-image");
    // profile_icon_button.onclick = function(){
    //     var login_popup = document.getElementById("user-options-popup");
    //     login_popup.style.display = "block";
    // }
    // var transparent_black_background = document.getElementById("transparent-black-background");
    // transparent_black_background.addEventListener("click", function(){
    //     var login_popup = document.getElementById("user-options-popup");
    //     login_popup.style.display = "none";
    // })

    var input_fields = document.querySelectorAll("input");
    console.log(input_fields)
    input_fields.forEach(function(input_field){
        input_field.addEventListener("click", function(){
            setCaretPosition(input_field, 3);
        })
    });
});

function setCaretPosition(el, caretPos) {
    if (el !== null) {
        if (el.createTextRange) {
            var range = el.createTextRange();
            range.move('character', caretPos);
            range.select();
            return true;
        }
        else if (el.selectionStart) {
            el.focus();
            el.setSelectionRange(caretPos, caretPos);
            return true;
        }
        else  {
            el.focus();
            return false;
        }
    }
}
