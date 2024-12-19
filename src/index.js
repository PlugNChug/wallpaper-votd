import grabVerse from "./verse";
import "./styles/main.scss";
import HornPeak from "./assets/HornPeak.jpg";
import NightSky from "./assets/NightSky.jpg";
import BlueGradient from "./assets/BlueGradient.svg";
import OrangeWaves from "./assets/OrangeWaves.svg";
import GreenTiles from "./assets/GreenTiles.svg";
import PinkWaves from "./assets/PinkWaves.svg";
import YellowZigZags from "./assets/YellowZigZags.svg";

const nextBG = document.getElementById("background1");
const currBG = document.getElementById("background2");

// var prevSecond = -1;
var grabCalled = false;

/**
 * A modified version of w3schools' js clock example.
 * Calls itself every half second.
 */
function clock() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();

  // At each second, refresh background (TESTING PURPOSES ONLY)
  // if (prevSecond !== s) {
  //   prevSecond = s;
  //   setBG(today);
  // }

  // A little after the top/bottom of each hour (XX:00:00 or XX:30:00), refresh the verse and background. 
  // A verse change and non-night background change should really only happen a little after midnight
  // Because we're calling clock() every 0.5 seconds, we have to check a flag that prevents this from being called twice in one second
  if (m % 30 === 0 && s === 20 && grabCalled) {
    grabVerse();
    setBG(today);
    grabCalled = false;
  } else {
    grabCalled = true;
  }

  // Convert values to displayable format
  h = h % 12 === 0 ? 12 : h % 12;
  m = formatTime(m);
  document.getElementById("clock").innerHTML = h + ":" + m;

  setTimeout(clock, 500);
}

/**
 * 
 * @param {Number} i 
 * @returns {*} Either the inputted number or a string that consists of the number and '0' appended in front of it
 */
function formatTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}

/**
 * Given a date, sets the background depending on the date/time
 * @param {Date} today 
 * 
 */
function setBG(today) {
  let d = today.getDay();
  let h = today.getHours();

  // The night background will override other backgrounds
  // If the night background hasn't been activated and it's past 6pm, switch to that background
  if ((h >= 18 || h < 6) && nextBG.src !== NightSky && currBG.src !== NightSky) {
    nextBG.src = NightSky;
    nextBG.classList.add("sway-bg");
    currBG.classList.add("fade-out");

    setTimeout(() => {
      currBG.src = nextBG.src;
      currBG.classList.add("sway-bg");
      currBG.classList.remove("fade-out");

      setTimeout(() => {
        nextBG.classList.remove("sway-bg");
      }, 5000);
    }, 5000);
    console.log("Here")
    return;
  } else if (h >= 18 || h < 6) {
    return;
  }

  // Change background depending on the day. 0 = Sunday, 1 = Monday, etc.
  // These are overridden by the night background
  switch (d % 7) {
    case 0:
      nextBG.src = BlueGradient;
      break;
    case 1:
      nextBG.src = OrangeWaves;
      break;
    case 2:
      nextBG.src = GreenTiles;
      break;
    case 3:
      nextBG.src = PinkWaves;
      break;
    case 4:
      nextBG.src = YellowZigZags;
      break;
    case 5:
      nextBG.src = NightSky;
      break;
    case 6:
      nextBG.src = HornPeak;
      break;
    default:
      break;
  }

  // Fade out the current background. This will reveal the next background
  currBG.classList.add("fade-out");
  // After 5 seconds (the length of the fade-out), do some swap shenanigans
  setTimeout(() => {
    // Swap the current background to be the next background
    currBG.src = nextBG.src;

    // Remove the swaying effect that's exclusive to the night background
    currBG.classList.remove("sway-bg");
    currBG.classList.remove("fade-out");
  }, 5000);
}

/**
 * Given a date, sets the background and next background depending on the date/time
 * @param {Date} today 
 * 
 */
function setInitialBG(today) {
  let d = today.getDay();
  let h = today.getHours();

  // The night background will override other backgrounds
  // If the night background hasn't been activated and it's past 6pm, switch to that background
  if (h >= 18 || h < 6) {
    currBG.src = NightSky;
    currBG.classList.add("sway-bg");
    nextBG.src = null;
    return;
  }
  
  // If not "night-time," remove any swaying effect that's exclusive to the night background
  // (This shouldn't actually remove anything, this is only here just in case)
  currBG.classList.remove("sway-bg");

  // Initialize backgrounds depending on the day
  // These are overridden by the night background
  switch (d % 7) {
    case 0:
      currBG.src = BlueGradient;
      break;
    case 1:
      currBG.src = OrangeWaves;
      break;
    case 2:
      currBG.src = GreenTiles;
      break;
    case 3:
      currBG.src = PinkWaves;
      break;
    case 4:
      currBG.src = YellowZigZags;
      break;
    case 5:
      currBG.src = GreenTiles;
      break;
    case 6:
      currBG.src = HornPeak;
      break;
    default:
      break;
  }
}

setInitialBG(new Date());
clock();
await grabVerse();

console.log("Everything should be on screen by now!");
