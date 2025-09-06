//TODO: List music from previous days
//TODO: Show song metadata
//TODO: Code it a becoming a bit of a mess. Start refactoring thing soon.

let hasClickedEver = false
let notMuted = false
let mutedByPreview = false
let bgmVol = 0;
const sheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9AQJRlqMIk6MdjmW_-4pMoWrRZqY1tUJou5qbi5pbJTPDXa8yq-SPvC_90BbPUJChYfVhMMc1oHFt/pub?gid=1266918037&single=true&output=csv";
var lastPreview;

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
        }).catch((error) => {
            $("html").click(function(){
                if (!hasClickedEver) {
                    hasClickedEver = true
                    initBGM(randomBgm);
                    $("#bgm")[0].play();
                }
            });
        });
    }

    await sleep(1000); //Hacky but it works
    //Audio Preview Event Listener
    $(".audio-preview audio").each(function(){
        $(this).on('play', previewPlaying)
        $(this).on('pause', previewPaused)
    })
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

    bgmVol = bgm.initVol;
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

    $("#song-title p").text(`${bgm.title} - ${bgm.author}`);
    $("#audioPlayer").css('right', '1%');
    await sleep(8000);
    $("#audioPlayer").css('right', '-80%');
    await sleep(500);
    $("#song-title p").hide();
    $("#song-title").css('padding', '3px 0 0 2px')
    $("#audioPlayer").css('right', '0.5%');
    $("#mute").show();

    if (notMuted) {
        $("#mute").src = '/assets/Images/unmuted.png'
    } else {
        $("#mute").src = '/assets/Images/muted.png'
    }

    //Mute
    $('#mute').click(function() {
        if (notMuted && mutedByPreview == false) {
            $("#bgm")[0].volume = 0;
            document.cookie = "muted=true";
            $('#mute')[0].src = "/assets/Images/muted.png"
        } else {
            console.log("Unmuting")
            $("#bgm")[0].volume = bgm.initVol || 1;
            document.cookie = "muted=false";
            $('#mute')[0].src = "/assets/Images/unmuted.png"

            if (mutedByPreview && lastPreview !== undefined) {
                lastPreview.pause();
                mutedByPreview = false;
            }
        }
        notMuted = !notMuted
    });
}

// This is stupid
function previewPlaying(event) {
    mutedByPreview = true
    console.log(event.target)
    if (lastPreview !== undefined && lastPreview !== event.target) lastPreview.pause();
    lastPreview = event.target;
    $("#bgm")[0].volume = 0;
    $('#mute')[0].src = "/assets/Images/muted.png"
};

function previewPaused(event) {
    console.log(event.target)
    if (lastPreview !== undefined && lastPreview.paused && notMuted && mutedByPreview == true) {
        mutedByPreview = false
        $("#bgm")[0].volume = bgmVol;
        $('#mute')[0].src = "/assets/Images/unmuted.png"
    }
};
