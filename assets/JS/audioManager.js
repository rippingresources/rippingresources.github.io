let playing = false

$(document).ready(function(){
    $("html").click(function(){
        if (!playing) {
            playing = !playing
            $("#bgm")[0].play();
        }
    });
});
