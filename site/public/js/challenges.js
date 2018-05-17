window.onload = function(){

    var challenge_links = document.querySelectorAll(".challenge-link")
    challenge_links.forEach(function(challenge_link){
        challenge_link.onclick = function(){
            //Reset previously clicked link 
            var current_challenge_links = document.querySelectorAll(".current-challenge-link")
            current_challenge_links.forEach(function(current_challenge_link){
                current_challenge_link.className = "challenge-link"
                current_challenge_link.style.color = ""
                var current_link_image = document.querySelectorAll(".current-link")
                current_challenge_link.removeChild(current_link_image[0])
            })
            //Set redirect location
            var redirect_location = document.getElementById(challenge_link.id.split("-")[0])
            redirect_location.scrollIntoView()
            //Set clicked link at current link
            challenge_link.className = "challenge-link current-challenge-link"
            challenge_link.style.color = "black"
            //Append Arrow
            var right_arrow = document.createElement("img");
            right_arrow.style= "float: left; width: 15px; height: 15px; margin-right: 10px"
            right_arrow.className="current-link"
            right_arrow.src = "../img/right-arrow.svg"
            challenge_link.insertBefore(right_arrow, challenge_link.children[0])
        }
    })
}