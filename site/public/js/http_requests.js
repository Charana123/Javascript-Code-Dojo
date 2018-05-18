
var httpGetAsync = function(theUrl){
    return new Promise((resolve, reject) => {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == XMLHttpRequest.DONE && xmlHttp.status == 200){
                    resolve(xmlHttp.responseText)
            }
        }
        xmlHttp.open("GET", theUrl, true); 
        xmlHttp.send(null);
    })
}

var httpPostAsync = function(theUrl, data){
    return new Promise((resolve, reject) => {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == XMLHttpRequest.DONE && xmlHttp.status == 200){
                    resolve(xmlHttp.responseText)
            }
        }
        xmlHttp.open("POST", theUrl, true); 
        xmlHttp.send(data);
    })
}
