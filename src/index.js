import { grabVerse } from "./verse";
import {
  setBackgroundContent,
  getBackgroundSource,
  removeInvisibleClass,
  addInvisibleClass,
  containsInvisibleClass,
  bgChooser,
  forceBackground,
} from "./backgroundHelper";
import "./styles/main.scss";

import NightSky from "./assets/NightSky.jpg";

let intervalID = null;

document.addEventListener("DOMContentLoaded", () => {
  // Default settings
  let version = "ESV";
  let version2 = "VOTD";
  let twentyFourHour = false;
  let disableClock = false;
  let forceBackgroundSetting = "none";
  let customFile = "";
  let staticBg = false;
  let staticVerseBox = false;

  /*  Wallpaper Engine will inject property updates through this listener. */
  window.wallpaperPropertyListener = {
    applyUserProperties: (props) => {
      if (props.bibleversion) version = props.bibleversion.value;
      if (props.bibleversion2) version2 = props.bibleversion2.value;
      if (props._24hourtime) twentyFourHour = props._24hourtime.value;
      if (props.disableclock) disableClock = props.disableclock.value;
      if (props.forcebackground)
        forceBackgroundSetting = props.forcebackground.value;
      if (props.customimage)
        customFile = "file:///" + props.customimage.value;
      if (props.customvideo)
        customFile = "file:///" + props.customvideo.value;
      if (props.staticbg) staticBg = props.staticbg.value;
      if (props.staticbox) staticVerseBox = props.staticbox.value;

      clearInterval(intervalID);
      initScreen();
    },
  };

  // Run once outside Wallpaper Engine (e.g. during local dev)
  // initScreen();

  function initScreen() {
    renderScreen(
      version,
      version2,
      twentyFourHour,
      disableClock,
      forceBackgroundSetting,
      customFile,
      staticBg,
      staticVerseBox,
    );
  }
});

function renderScreen(
  version,
  version2,
  twentyFourHour,
  disableClock,
  forceBackgroundSetting,
  customFile,
  staticBg,
  staticVerseBox,
) {
  const nextBG = document.getElementById("background1");
  const currBG = document.getElementById("background2");
  const overlayBG = document.getElementById("background3");

  // Guarantee that the overlay has a source to avoid flashing on startup
  if (!getBackgroundSource(overlayBG)) {
    setBackgroundContent(overlayBG, NightSky, staticBg);
  }

  setInitialBG(
    new Date(),
    currBG,
    nextBG,
    overlayBG,
    forceBackgroundSetting,
    customFile,
    staticBg,
  );
  grabVerse(version, version2);

  intervalID = setInterval(() => {
    tick(
      currBG,
      nextBG,
      overlayBG,
      version,
      version2,
      disableClock,
      twentyFourHour,
      forceBackgroundSetting,
      customFile,
      staticBg,
      staticVerseBox,
    );
  }, 500);
}

/**
 * Updates clock, verse (every half‑hour), and backgrounds (every tick).
 */
function tick(
  currBG,
  nextBG,
  overlayBG,
  version,
  version2,
  disableClock,
  twentyFourHour,
  forceBackgroundSetting,
  customFile,
  staticBg,
  staticVerseBox,
) {
  // Every tick, check for user property changes
  // Disable clock if the user requested it
  if (disableClock) {
    document.querySelector(".time").classList.add("invisible");
  } else {
    document.querySelector(".time").classList.remove("invisible");
  }

  // Disable verse box ripple if the user requested it
  if (staticVerseBox) {
    // Disable the verse box
    document.getElementById("box").classList.add("paused");
  } else {
    // Enable the verse box
    document.getElementById("box").classList.remove("paused");
  }
  const now = new Date();

  // Refresh verse at xx:00:30 and xx:30:30
  if (now.getSeconds() === 30 && now.getMinutes() % 30 === 0) {
    grabVerse(version, version2);
  }

  updateClock(now, twentyFourHour);
  updateBackground(
    now,
    currBG,
    nextBG,
    overlayBG,
    forceBackgroundSetting,
    customFile,
    staticBg,
  );
}

function updateClock(date, twentyFourHour) {
  const hours = twentyFourHour ? date.getHours() : (date.getHours() % 12) || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  document.getElementById("clock").textContent = `${hours}:${minutes}`;
  document.getElementById("day").textContent = date.getDate();
  document.getElementById("month").textContent = date
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  document.getElementById("year").textContent = date.getFullYear();
}

/**
 * Switches background based on the time of day / day of week.
 */
function updateBackground(
  date,
  currBG,
  nextBG,
  overlayBG,
  forceBackgroundSetting,
  customFile,
  staticBg,
) {
  if (forceBackgroundSetting !== "none") {
    forceBackground(overlayBG, forceBackgroundSetting, customFile, staticBg);
    removeInvisibleClass(overlayBG);
    return;
  }

  const hour = date.getHours();
  const isNight = hour >= 18 || hour < 6;

  if (isNight) {
    setBackgroundContent(overlayBG, NightSky, staticBg);
    removeInvisibleClass(overlayBG);
  } else {
    addInvisibleClass(overlayBG);
  }

  // Rotate daily backgrounds on the main layers
  bgChooser(date.getDay(), nextBG, staticBg);

  // Fade out current, then swap sources after transition
  addInvisibleClass(currBG);
  setTimeout(() => {
    setBackgroundContent(currBG, getBackgroundSource(nextBG), staticBg);
    removeInvisibleClass(currBG);
  }, 5000);
}

/**
 * Sets initial backgrounds on startup.
 */
function setInitialBG(
  date,
  currBG,
  nextBG,
  overlayBG,
  forceBackgroundSetting,
  customFile,
  staticBg,
) {
  if (forceBackgroundSetting !== "none") {
    forceBackground(overlayBG, forceBackgroundSetting, customFile, staticBg);
    removeInvisibleClass(overlayBG);
    return;
  }

  const hour = date.getHours();
  const isNight = hour >= 18 || hour < 6;
  if (isNight) {
    setBackgroundContent(overlayBG, NightSky, staticBg);
    removeInvisibleClass(overlayBG);
  }

  bgChooser(date.getDay(), currBG, staticBg);
}
