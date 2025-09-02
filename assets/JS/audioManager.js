//TODO: Grab music from spreadsheet
//TODO: List music from previous days
//TODO: Show song metadata
//TODO: Check cookies to see if the bgm should say muted on first click.
//

let hasClickedEver = false
let playing = false


$(document).ready(function(){
    $("html").click(function(){
        if (!hasClickedEver) {
            hasClickedEver = true
            playing = !playing
            $("#bgm")[0].play();
        }
    });

    $('#mute').click(function() {
        if (playing) {
            $("#bgm")[0].pause();
        } else {
            $("#bgm")[0].play();
        }
        playing = !playing
    });
});
