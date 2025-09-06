//TODO: List music from previous days
//TODO: Show song metadata
//TODO: Mute BGM when playing preview

let hasClickedEver = false
let notMuted = false
const sheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9AQJRlqMIk6MdjmW_-4pMoWrRZqY1tUJou5qbi5pbJTPDXa8yq-SPvC_90BbPUJChYfVhMMc1oHFt/pub?gid=1266918037&single=true&output=csv";

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

//https://stackoverflow.com/a/25490531
const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)

async function getData() {
    let req = await fetch(sheet);
    let csv = await req.text();
    return Papa.parse(csv, { header: true }).data;
}

$(document).ready(async function(){

    let bgmData = await getData();
    console.log(bgmData, bgmData.length);
    let randomBgm = bgmData[Math.floor(Math.random()*bgmData.length)];
    var playResults = $("#bgm")[0].play()

    if (playResults !== undefined) {
        playResults.then(() => {
            initBGM(randomBgm)
        }).catch((error) =>{
            $("html").click(function(){
                if (!hasClickedEver) {
                    hasClickedEver = true
                    initBGM(randomBgm);
                    $("#bgm")[0].play();
                }
            });
        });
    }
});

function initBGM(bgm) {
    $("#bgm")[0].src = bgm.link;
    displayTrack(bgm);

    if (getCookieValue('muted') != 'true') {
        $("#bgm")[0].volume = bgm.initVol || 1;
        notMuted = !notMuted
    } else {
        $("#bgm")[0].volume = 0
    }
}

async function displayTrack(bgm) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: bgm.title,
        artist: bgm.author,
        album: "Ripping Resources FLP Archive",
        artwork: [
            { src: '/assets/Images/RRFLPA_Cover_512.jpg', sizes: '512x512', type: 'image/jpeg' },
        ]
    });

    $("#song-title").text(`${bgm.title} - ${bgm.author}`);
    $("#audioPlayer").css('right', '1%');
    await sleep(8000);
    $("#audioPlayer").css('right', '-80%');
    await sleep(500);
    $("#song-title").css('padding', '3px 0 0 2px')
    $("#audioPlayer").css('right', '0.5%');

    if (notMuted) {
        $("#song-title").html('<img src="/assets/Images/unmuted.png" id="mute"></img>')
    } else {
        $("#song-title").html('<img src="/assets/Images/muted.png" id="mute"></img>')
    }

    $('#mute').click(function() {
        if (notMuted) {
            $("#bgm")[0].volume = 0;
            document.cookie = "muted=true";
            $('#mute')[0].src = "/assets/Images/muted.png"
        } else {
            $("#bgm")[0].volume = bgm.initVol || 1;
            document.cookie = "muted=false";
            $('#mute')[0].src = "/assets/Images/unmuted.png"
        }
        notMuted = !notMuted
    });
}
