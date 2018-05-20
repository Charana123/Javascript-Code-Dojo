var current_slide = 0;

window.addEventListener("load", function(){

    var slideshowElements = document.querySelectorAll(".index-slideshow-div");
    slideshowElements[current_slide].style.display = "block";
    window.setInterval(nextSlide, 3000);
});

function nextSlide(){
    var slideshowElements = document.querySelectorAll(".index-slideshow-div");
    fadeOutAffect(slideshowElements, slideshowElements[current_slide]);
}

function fadeOutAffect(slideshowElements, fadeTarget){
    var fadeEffect = setInterval(function () {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity < 0.1) {
            clearInterval(fadeEffect);
            fadeTarget.style.display = "none";
            fadeTarget.style.opacity = 1;
            current_slide = (current_slide + 1) % slideshowElements.length;
            slideshowElements[current_slide].style.display = "block";
        } else {
            fadeTarget.style.opacity -= 0.05;
        }
    }, 50);
}

