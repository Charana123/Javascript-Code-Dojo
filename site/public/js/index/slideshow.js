window.onload = function(){
    showSlides()
    window.setInterval(showSlides, 2000);
    console.log("set timeout")
}

var slide_index = 0;
var showSlides = function(){
    var slides = document.querySelectorAll(".slide");
    slides.forEach(function(slide){
        slide.style.display = "none"; 
    })
    slides[slide_index].style.display = "block";
    //slide_index = (slide_index + 1) % slides.length;
}