//TODO: Grab music from spreadsheet
//TODO: List music from previous days
//TODO: Show song metadata
//TODO: Check cookies to see if the bgm should say muted on first click.
//

let hasClickedEver = false
let playing = false
const sheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9AQJRlqMIk6MdjmW_-4pMoWrRZqY1tUJou5qbi5pbJTPDXa8yq-SPvC_90BbPUJChYfVhMMc1oHFt/pub?gid=1266918037&single=true&output=csv";

async function getData() {
    let req = await fetch(sheet);
    let csv = await req.text();
    return Papa.parse(csv, { header: true }).data;
}

$(document).ready(async function(){

    let bgmData = await getData();
    console.log(bgmData, bgmData.length);
    let randomBgm = bgmData[Math.floor(Math.random()*bgmData.length)];
    $("#bgm")[0].src = randomBgm.link;

    $("html").click(function(){
        if (!hasClickedEver) {
            hasClickedEver = true
            playing = !playing
            $("#song-title").text(`${randomBgm.title} - ${randomBgm.author}`);
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

