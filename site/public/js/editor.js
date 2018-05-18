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


var back = function() {
    window.location='/challenges';
}

var submitCode = function(challenge_id){
    document.getElementById("submit-button").style.visibility = "hidden";
    document.getElementById("submit-button").style.visibility = "hidden";
    document.getElementById("loader").style.visibility = "visible";
    var user_script_container = ace.edit("editor");
    httpPostAsync("/challenge_request/" + challenge_id, user_script_container.getValue())
        .then(res => {
                var json = JSON.parse(res);
                if (json.output[json.output.length-1] == "\n") {
                    json.output = json.output.substring(0, json.output.length - 1);
                }

                var output_editor = ace.edit("output");
                document.getElementById("loader").style.visibility = "hidden";
                document.getElementById("submit-button").style.visibility = "visible";
                document.getElementById("answer").textContent = "The answer is: "+ json.ans;
                output_editor.setValue(json.output);
                output.selection.setRange({start: {row:0, column:0}, end: {row:0, column:0}});
        })
}