let disabled = false

//https://stackoverflow.com/a/25490531
const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)
$(document).ready(async function(){
    if (getCookieValue('animate') != 'true') {
        $("#animations-button")[0].src = '/assets/Images/animationsEnabled.png'
    } else {
        $("#animations-button")[0].src = '/assets/Images/animationsDisabled.png'
        disabled = true;
    }
    toggleAnimations();

    //Mute
    $('#animations-button').click(function() {
        if (disabled) {
            document.cookie = "animate=true";
            $('#animations-button')[0].src = "/assets/Images/animationsEnabled.png"
        } else {
            document.cookie = "animate=false";
            $('#animations-button')[0].src = "/assets/Images/animationsDisabled.png"
        }
        disabled = !disabled
        toggleAnimations();
    });
});

function toggleAnimations() {
    if (disabled) {
        $('#stripes').css('animation', 'none');
        $('#checkerboard').css('animation', 'none');
    } else {
        $('#stripes').css('animation', '');
        $('#checkerboard').css('animation', '');
    }
}
