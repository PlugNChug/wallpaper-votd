import grabVerse from "./verse";
import "./styles/main.scss";
import HornPeak from "./assets/HornPeak.jpg";

const mountainImg = document.getElementById("mountainImg");
mountainImg.src = HornPeak;

await grabVerse();

// Modified version of w3schools' js clock example
function clock() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  m = checkTime(m);
  document.getElementById("clock").innerHTML = h + ":" + m;
  setTimeout(clock, 1000);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}

clock();

console.log("Everything should be on screen by now!");
