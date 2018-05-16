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
    var picture_button = document.getElementById("fileUpload");
    picture_button.onclick = function(){

        var fileUpload = document.getElementById('fileUpload');
        var canvas  = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");

        function readImage() {
            if ( this.files && this.files[0] ) {
                var FR= new FileReader();
                FR.onload = function(e) {
                    var img = new Image();
                    img.src = e.target.result;
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0, 512, 512);

                        httpPostAsync("/image_submission", img.src).then(json_response => {
                        })
                    };
                };
                FR.readAsDataURL( this.files[0] );

            }
        }

        fileUpload.onchange = readImage;

        canvas.onclick = function(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        };
    }
});
