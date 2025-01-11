import { grabVerse } from "./verse";
import "./styles/main.scss";
import HornPeak from "./assets/HornPeak.jpg";
import NightSky from "./assets/NightSky.jpg";
import BlueGradient from "./assets/BlueGradient.svg";
import OrangeWaves from "./assets/OrangeWaves.svg";
import GreenTiles from "./assets/GreenTiles.svg";
import PinkWaves from "./assets/PinkWaves.svg";
import YellowZigZags from "./assets/YellowZigZags.svg";
import SoftGradient from "./assets/SoftGradient.svg";

var intervalID = null;

document.addEventListener("DOMContentLoaded", () => {
  var version = "VOTD";
  var version2 = "VOTD";
  var _24hourtime = false;
  var forcebackground = "none";
  window.wallpaperPropertyListener = {
    applyUserProperties: (properties) => {
      if (properties.bibleversion) version = properties.bibleversion.value;
      if (properties.bibleversion2) version2 = properties.bibleversion2.value;
      if (properties._24hourtime) _24hourtime = properties._24hourtime.value;
      if (properties.forcebackground)
        forcebackground = properties.forcebackground.value;
      screen(version, version2, _24hourtime, forcebackground);
    },
  };

  // To test outside of Wallpaper Engine, uncomment the following, npm run dev
  // screen(version, version2, _24hourtime, forcebackground);
});

function screen(version, version2, _24hourtime, forcebackground) {
  const nextBG = document.getElementById("background1");
  const currBG = document.getElementById("background2");
  const overlayBG = document.getElementById("background3");
  if (overlayBG.src === null) {
    overlayBG.src = NightSky;
  }

  if (intervalID !== null) {
    clearInterval(intervalID);
  }
  setInitialBG(new Date(), currBG, nextBG, overlayBG, forcebackground);
  grabVerse(version, version2);
  intervalID = setInterval(
    () =>
      clock(
        false,
        currBG,
        nextBG,
        overlayBG,
        version,
        version2,
        _24hourtime,
        forcebackground
      ),
    500
  );
}

/**
 * A modified version of w3schools' js clock example.
 * Calls itself every half second.
 */
function clock(
  grabCalled,
  currBG,
  nextBG,
  overlayBG,
  version,
  version2,
  _24hourtime,
  forcebackground
) {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();

  // A little after the top/bottom of each hour (XX:00:00 or XX:30:00), refresh the verse and background.
  // A verse change should really only happen a little after midnight
  // Because we're calling clock() every 0.5 seconds, we have to check a flag that prevents this from being called 2x in one second
  if (m % 30 === 0 && s === 30 && grabCalled) {
    grabVerse(version, version2);
    grabCalled = false;
  } else {
    grabCalled = true;
  }

  // Call the background switcher.
  setBG(today, currBG, nextBG, overlayBG, forcebackground);

  // Convert values to displayable format
  if (!_24hourtime) {
    h = h % 12 === 0 ? 12 : h % 12;
  }
  m = formatTime(m);
  document.getElementById("clock").innerHTML = h + ":" + m;
  document.getElementById("day").innerHTML = today.getDate();
  document.getElementById("month").innerHTML = today
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  document.getElementById("year").innerHTML = today.getFullYear();
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
function setBG(today, currBG, nextBG, overlayBG, forcebackground) {
  if (forcebackground !== "none") {
    forceTheBackground(forcebackground);
    overlayBG.classList.remove("invisible");
    return;
  } else {
    overlayBG.classList.add("invisible");
  }

  let d = today.getDay();
  let h = today.getHours();

  // The night background will override other backgrounds
  // If the night background hasn't been activated and it's past 6pm, switch to that background
  if ((h >= 18 || h < 6) && overlayBG.classList.contains("invisible")) {
    overlayBG.src = NightSky;
    overlayBG.classList.remove("invisible");
    return;
  } else if (h >= 18 || h < 6) {
    overlayBG.src = NightSky;
    return;
  } else {
    overlayBG.classList.add("invisible");
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
      nextBG.src = SoftGradient;
      break;
    case 6:
      nextBG.src = HornPeak;
      break;
    default:
      break;
  }

  // Fade out the current background. This will reveal the next background
  currBG.classList.add("invisible");
  // After 5 seconds (the length of the fade-out), do some swap shenanigans
  setTimeout(() => {
    // Swap the current background to be the next background
    currBG.src = nextBG.src;

    currBG.classList.remove("invisible");
  }, 5000);
}

/**
 * Given a date, sets the background and next background depending on the date/time
 * @param {Date} today
 *
 */
function setInitialBG(today, currBG, nextBG, overlayBG, forcebackground) {
  if (forcebackground !== "none") {
    forceTheBackground(overlayBG, forcebackground);
    overlayBG.classList.remove("invisible");
    return;
  } else {
    overlayBG.classList.add("invisible");
  }

  let d = today.getDay();
  let h = today.getHours();

  // The night background will override other backgrounds
  // If the night background hasn't been activated and it's past 6pm, switch to that background
  if (h >= 18 || h < 6) {
    overlayBG.src = NightSky;
    overlayBG.classList.remove("invisible");
    return;
  }

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
      currBG.src = SoftGradient;
      break;
    case 6:
      currBG.src = HornPeak;
      break;
    default:
      break;
  }
}

function forceTheBackground(overlayBG, forcebackground) {
  switch (forcebackground) {
    case "night":
      overlayBG.src = NightSky;
      break;
    case "mountain":
      overlayBG.src = HornPeak;
      break;
    case "blue":
      overlayBG.src = BlueGradient;
      break;
    case "green":
      overlayBG.src = GreenTiles;
      break;
    case "orange":
      overlayBG.src = OrangeWaves;
      break;
    case "pink":
      overlayBG.src = PinkWaves;
      break;
    case "yellow":
      overlayBG.src = YellowZigZags;
      break;
    case "gradient":
      overlayBG.src = SoftGradient;
      break;
    default:
      overlayBG.src = NightSky;
      break;
  }
}
