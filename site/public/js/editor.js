window.addEventListener("load", function(){

    var editor = ace.edit("editor");
    var output = ace.edit("output");

    editor.setTheme("ace/theme/gruvbox");
    editor.session.setMode("ace/mode/javascript");
    editor.renderer.setCursorStyle("smooth");
    editor.session.setUseWrapMode(true);
    editor.session.setWrapLimitRange(80, 80);

    output.setTheme("ace/theme/gruvbox");
    output.renderer.setCursorStyle("none");
    output.session.setUseWrapMode(true);
    output.session.setWrapLimitRange(60, 80);
    output.setOptions({readOnly: true, highlightActiveLine: false, highlightGutterLine: false});


    document.getElementById("cross-icon").addEventListener("click", function(event){
        document.getElementById("answer-popup").style.display = "none";
    });
    document.getElementById("answer-popup").addEventListener("click", function(event){
        if(event.target.id === "transparent-black-background"){
            document.getElementById("answer-popup").style.display = "none";
        }
    });

})

var back = function() {
    window.location='/challenges';
}

var submitCode = function(challenge_id){
    document.getElementById("loader").style.display = "block";
    document.getElementById("submit-button").style.display = "none";
    var user_script_container = ace.edit("editor");
    httpPostAsync("/challenge_request/" + challenge_id, user_script_container.getValue())
        .then(res => {
                var json = JSON.parse(res);
                if (json.output[json.output.length-1] == "\n") {
                    json.output = json.output.substring(0, json.output.length - 1);
                }

                var output_editor = ace.edit("output");
                document.getElementById("loader").style.display = "none";
                document.getElementById("submit-button").style.display = "block";
                document.getElementById("answer-popup").style.display = "block";
                console.log("answer = " + json.ans);
                if(json.ans === "correct!") document.getElementById("answer-popup-container").style.background = "url('/img/success-graphic.png')";
                else document.getElementById("answer-popup-container").style.background = "url('/img/wrong-graphic.png')";
                document.getElementById("answer-popup-container").style.backgroundSize = "100% 100%";
                // document.getElementById("answer").textContent = json.ans;

                var output = ace.edit("output");
                output_editor.setValue(json.output);
                output_editor.selection.setRange({start: {row:0, column:0}, end: {row:0, column:0}});
        })
}

function uploadCode(files){
    var selectedFile = files[0];
    var reader = new FileReader();
    reader.onload = function(event){
        var editor = ace.edit("editor");
        editor.setValue(event.target.result);
    }
    reader.readAsText(selectedFile);
}

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
