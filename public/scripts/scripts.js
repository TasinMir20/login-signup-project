var seconds = document.querySelector(".seconds").value;

function myFun() {

    seconds = Number(seconds) - 1;

    if (seconds >= 0) {

        var min = Math.floor(seconds / 60);
        var andSec = Math.floor(seconds % 60);

        var hour = Math.floor(min / 60);
        var andMin = Math.floor(min % 60);

        var resendCodeAfter = `${hour}: ${andMin}: ${andSec}`;

        document.querySelector(".code-resend-time").innerHTML = resendCodeAfter;

    } else {
        document.querySelector(".code-resend-time").innerHTML = "";
    }
}

setInterval(myFun, 1000);