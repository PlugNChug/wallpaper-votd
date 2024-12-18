import grabVerse from "./verse";
import "./styles/main.scss";
import HornPeak from "./assets/HornPeak.jpg";
import NightSky from "./assets/NightSky.jpg";
import BlueGradient from "./assets/BlueGradient.svg";
import OrangeWaves from "./assets/OrangeWaves.svg";
import GreenTiles from "./assets/GreenTiles.svg";
import PinkWaves from "./assets/PinkWaves.svg";

const nextBG = document.getElementById("background1");
const currBG = document.getElementById("background2");

var prevSecond = -1;
var grabCalled = false;

// Modified version of w3schools' js clock example
function clock() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();

  // At each second, refresh background (TESTING PURPOSES ONLY)
  if (prevSecond !== s) {
    prevSecond = s;
    setBG(today);
  }

  // At the top/bottom of each hour (XX:00:00 or XX:30:00), refresh the verse and background. A change should really only happen at midnight.
  if (m % 30 === 0 && s === 0 && grabCalled) {
    grabVerse();
    grabCalled = false;
  } else {
    grabCalled = true;
  }

  // Convert values to displayable format
  h = h % 12 === 0 ? 12 : h % 12;
  m = checkTime(m);
  document.getElementById("clock").innerHTML = h + ":" + m;

  setTimeout(clock, 500);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}

function setBG(today) {
  let d = today.getSeconds();
  switch (d % 7) {
    case 0:
      nextBG.src = BlueGradient;
      currBG.classList.add("fade-out");
      break;
    case 1:
      nextBG.src = OrangeWaves;
      currBG.classList.add("fade-out");
      break;
    case 2:
      nextBG.src = GreenTiles;
      currBG.classList.add("fade-out");
      break;
    case 3:
      nextBG.src = PinkWaves;
      currBG.classList.add("fade-out");
      break;
    case 4:
      break;
    case 5:
      nextBG.src = NightSky;
      currBG.classList.add("fade-out");
      break;
    case 6:
      nextBG.src = HornPeak;
      currBG.classList.add("fade-out");
      break;
    default:
      break;
  }
  setTimeout(() => {
    currBG.src = nextBG.src;
    currBG.classList.remove("fade-out");
  }, 500);
}

function setInitialBG(today) {
  let d = today.getSeconds();
  switch (d % 3) {
    case 0:
      // Start fade out
      currBG.src = BlueGradient;
      nextBG.src = OrangeWaves;
      break;
    case 1:
      currBG.src = OrangeWaves;
      nextBG.src = GreenTiles;
      break;
    case 2:
      currBG.src = GreenTiles;
      nextBG.src = PinkWaves;
      break;
    case 3:
      currBG.src = PinkWaves;
      nextBG.src = BlueGradient;
      break;
    case 4:
      currBG.src = GreenTiles;
      nextBG.src = HornPeak;
      break;
    case 5:
      currBG.src = GreenTiles;
      nextBG.src = HornPeak;
      break;
    case 6:
      currBG.src = HornPeak;
      nextBG.src = BlueGradient;
      break;
    default:
      break;
  }
}

setInitialBG(new Date());
clock();
await grabVerse();

console.log("Everything should be on screen by now!");
