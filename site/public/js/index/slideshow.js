window.onload = function(){
    showSlides()
    window.setInterval(showSlides, 3000);
    console.log("set timeout");
}

var slide_index = 1;
var showSlides = function(){
    var slides = document.querySelectorAll(".slide");
    slides.forEach(function(slide){
        slide.style.display = "none"; 
    })
    slides[slide_index].style.display = "block";
    slide_index = (slide_index + 1) % slides.length;
}

// window.onload = function(){
//     var slides = document.querySelectorAll(".slide");
//     for(var i = 0; i < slides.length; i++){
//         slides[i].style["zIndex"] = i + 1;
//         slides[i].position = "absolute";
//     }
//     showSlides(slides)
// }

// var slide_index = 0;
// var showSlides = function(slides){
//     //Make only current visible
//     slides.forEach(function(slide){
//         slide.style.opacity = 0;
//     })
//     slides[slide_index].style.opacity = 1;
//     //Remove opacity from current
//     var fade_between = window.setInterval(function(){
//         slides[slide_index].style.opacity = slides[slide_index].style.opacity - 0.1;
//         slides[(slide_index + 1) % slides.length].style.opacity = slides[(slide_index + 1) % slides.length].style.opacity + 0.1;
//         if(slides[slide_index].style.opacity == 0){
//             window.clearInterval(fade_between);
//             slide_index = (slide_index + 1) % slides.length;
//             showSlides(slides);
//         }
//     }, 100);
// }