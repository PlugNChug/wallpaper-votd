import { grabVerse } from "./verse";
import {
  setBackgroundContent,
  getBackgroundSource,
  removeInvisibleClass,
  addInvisibleClass,
  bgChooser,
  forceBackground,
} from "./backgroundHelper";
import {
  loadSettingsCache,
  saveSettingsCache,
} from "./verse-fetching/fetchUtils";
import "./styles/main.scss";

import NightSky from "./assets/NightSky.jpg";

const CLOCK_POSITIONS = [
  "hidden",
  "topleft",
  "middleleft",
  "bottomleft",
  "topcenter",
  "bottomcenter",
  "topright",
  "middleright",
  "bottomright",
];

const VERSE_BOX_MODES = ["ripple", "noripple", "nobox"];

/** Gaps shorter than this are treated as brief pause (minimize), not sleep. */
const SLEEP_GAP_MS = 30000;

let intervalID = null;
let bgFadeTimeoutId = null;
let lastBgKey = null;
let lastClockPosition = null;
let lastVerseBox = null;
let lastClockKey = null;
let wakeDebounceId = null;
let lastTickAt = Date.now();
/** Ignore wake recovery briefly after a property apply. */
let suppressWakeUntil = 0;
let domReady = false;
let pendingProps = null;
/** True while Wallpaper Engine reports the wallpaper as paused. */
let wePaused = false;

/** Runtime settings shared with wake/online handlers. */
let runtime = null;

const DEFAULT_SETTINGS = {
  version: "ESV",
  version2: "VOTD",
  twentyFourHour: false,
  clockPosition: "topright",
  monthLocale: "en-US",
  forceBackgroundSetting: "none",
  customFile: "",
  staticBg: false,
  verseBox: "ripple",
};

function normalizeCachedSettings(cached) {
  if (!cached) return null;

  let clockPosition = cached.clockPosition;
  if (!CLOCK_POSITIONS.includes(clockPosition)) {
    if (cached.disableClock === true) clockPosition = "hidden";
    else clockPosition = DEFAULT_SETTINGS.clockPosition;
  }

  let verseBox = cached.verseBox;
  if (!VERSE_BOX_MODES.includes(verseBox)) {
    if (cached.staticVerseBox === true) verseBox = "noripple";
    else verseBox = DEFAULT_SETTINGS.verseBox;
  }

  return {
    version:
      cached.version === "eng_asv"
        ? "ASV"
        : (cached.version ?? DEFAULT_SETTINGS.version),
    version2:
      cached.version2 === "eng_asv"
        ? "ASV"
        : (cached.version2 ?? DEFAULT_SETTINGS.version2),
    twentyFourHour: cached.twentyFourHour ?? DEFAULT_SETTINGS.twentyFourHour,
    clockPosition,
    monthLocale: cached.monthLocale ?? DEFAULT_SETTINGS.monthLocale,
    forceBackgroundSetting:
      cached.forceBackgroundSetting ?? DEFAULT_SETTINGS.forceBackgroundSetting,
    customFile: cached.customFile ?? DEFAULT_SETTINGS.customFile,
    staticBg: cached.staticBg ?? DEFAULT_SETTINGS.staticBg,
    verseBox,
  };
}

const cached = normalizeCachedSettings(loadSettingsCache());
let version = cached?.version ?? DEFAULT_SETTINGS.version;
let version2 = cached?.version2 ?? DEFAULT_SETTINGS.version2;
let twentyFourHour = cached?.twentyFourHour ?? DEFAULT_SETTINGS.twentyFourHour;
let clockPosition = cached?.clockPosition ?? DEFAULT_SETTINGS.clockPosition;
let monthLocale = cached?.monthLocale ?? DEFAULT_SETTINGS.monthLocale;
let forceBackgroundSetting =
  cached?.forceBackgroundSetting ?? DEFAULT_SETTINGS.forceBackgroundSetting;
let customFile = cached?.customFile ?? DEFAULT_SETTINGS.customFile;
let staticBg = cached?.staticBg ?? DEFAULT_SETTINGS.staticBg;
let verseBox = cached?.verseBox ?? DEFAULT_SETTINGS.verseBox;

/**
 * Wallpaper Engine requires wallpaperPropertyListener on window immediately,
 * outside DOMContentLoaded — otherwise property events are missed (especially
 * after sleep/resume when CEF is partially restored).
 */
function bindPropertyListener() {
  window.wallpaperPropertyListener = {
    applyUserProperties(props) {
      handleUserProperties(props);
    },
    setPaused(isPaused) {
      wePaused = !!isPaused;
      if (isPaused) {
        document.body.classList.add("wallpaper-paused");
        return;
      }
      document.body.classList.remove("wallpaper-paused");
      bindPropertyListener();
      // Brief minimize/restore must NOT remount media (causes white flashes).
      lastTickAt = Date.now();
      ensureBackgroundVisible();
    },
  };
}

function handleUserProperties(props) {
  if (!props) return;

  if (!domReady) {
    pendingProps = { ...(pendingProps || {}), ...props };
    applyPropsToState(props);
    return;
  }

  applyPropsToState(props);

  cancelWakeRecovery();
  suppressWakeUntil = Date.now() + 2500;

  clearInterval(intervalID);
  clearBgFadeTimeout();
  lastBgKey = null;
  lastClockPosition = null;
  lastVerseBox = null;
  lastClockKey = null;
  initScreen();
}

function applyPropsToState(props) {
  if (props.bibleversion) version = props.bibleversion.value;
  if (props.bibleversion2) version2 = props.bibleversion2.value;
  // Legacy helloao ASV id → Bolls ASV
  if (version === "eng_asv") version = "ASV";
  if (version2 === "eng_asv") version2 = "ASV";
  if (props._24hourtime) twentyFourHour = props._24hourtime.value;
  if (props.clockposition) clockPosition = props.clockposition.value;
  if (props.monthlocale) monthLocale = props.monthlocale.value;
  // Legacy bool property from older builds
  if (props.disableclock && typeof props.disableclock.value === "boolean") {
    clockPosition = props.disableclock.value ? "hidden" : "topright";
  }
  if (props.forcebackground)
    forceBackgroundSetting = props.forcebackground.value;
  if (props.customimage) customFile = "file:///" + props.customimage.value;
  if (props.customvideo) customFile = "file:///" + props.customvideo.value;
  if (props.staticbg) staticBg = props.staticbg.value;
  if (props.versebox) verseBox = props.versebox.value;
  // Legacy bool property from older builds
  if (props.staticbox && typeof props.staticbox.value === "boolean") {
    verseBox = props.staticbox.value ? "noripple" : "ripple";
  }
}

function initScreen() {
  runtime = {
    version,
    version2,
    twentyFourHour,
    clockPosition,
    monthLocale,
    forceBackgroundSetting,
    customFile,
    staticBg,
    verseBox,
  };
  saveSettingsCache(runtime);
  renderScreen(runtime);
}

bindPropertyListener();

document.addEventListener("DOMContentLoaded", () => {
  domReady = true;

  if (pendingProps) {
    const queued = pendingProps;
    pendingProps = null;
    handleUserProperties(queued);
  } else {
    initScreen();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.body.classList.add("wallpaper-paused");
      return;
    }
    document.body.classList.remove("wallpaper-paused");
    bindPropertyListener();
    // Only hard-remount after a long freeze (PC sleep), not window minimize.
    const gap = Date.now() - lastTickAt;
    lastTickAt = Date.now();
    if (gap >= SLEEP_GAP_MS) {
      scheduleWakeRecovery(true);
    } else {
      ensureBackgroundVisible();
    }
  });

  window.addEventListener("online", () => {
    scheduleWakeRecovery(true);
  });
});

function clearBgFadeTimeout() {
  if (bgFadeTimeoutId != null) {
    clearTimeout(bgFadeTimeoutId);
    bgFadeTimeoutId = null;
  }
}

function cancelWakeRecovery() {
  if (wakeDebounceId != null) {
    clearTimeout(wakeDebounceId);
    wakeDebounceId = null;
  }
}

function scheduleWakeRecovery(forceRemount = true) {
  if (!runtime || !domReady) return;
  if (Date.now() < suppressWakeUntil) return;
  if (wakeDebounceId != null) clearTimeout(wakeDebounceId);
  wakeDebounceId = setTimeout(() => {
    wakeDebounceId = null;
    if (Date.now() < suppressWakeUntil) return;
    recoverAfterWake(runtime, forceRemount);
  }, 1000);
}

/**
 * Keep daytime/night layers visible without destroying media elements.
 */
function ensureBackgroundVisible() {
  if (!runtime || !domReady) return;

  const currBG = document.getElementById("background2");
  const overlayBG = document.getElementById("background3");
  if (!currBG || !overlayBG) return;

  document.body.classList.remove("wallpaper-paused");

  if (runtime.forceBackgroundSetting !== "none") {
    removeInvisibleClass(overlayBG);
    return;
  }

  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  if (isNight) {
    removeInvisibleClass(overlayBG);
  } else {
    removeInvisibleClass(currBG);
    addInvisibleClass(overlayBG);
  }

  // Resume custom video if present
  const video =
    overlayBG.querySelector("video") || currBG.querySelector("video");
  if (video && !runtime.staticBg && video.paused) {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }
}

/**
 * Rebuild background DOM and/or refresh verse after a real sleep/wake.
 * Pass forceRemount=false to avoid tearing down SVG/video (minimize flash).
 */
function recoverAfterWake(settings, forceRemount = true) {
  if (!settings || !domReady) return;

  bindPropertyListener();

  const nextBG = document.getElementById("background1");
  const currBG = document.getElementById("background2");
  const overlayBG = document.getElementById("background3");

  clearBgFadeTimeout();
  document.body.classList.remove("wallpaper-paused");

  if (forceRemount) {
    lastBgKey = null;
    setInitialBG(
      new Date(),
      currBG,
      nextBG,
      overlayBG,
      settings.forceBackgroundSetting,
      settings.customFile,
      settings.staticBg,
      true,
    );
  }

  ensureBackgroundVisible();
  grabVerse(settings.version, settings.version2);
  lastTickAt = Date.now();
}

function applyClockPosition(position) {
  const el = document.querySelector(".time");
  if (!el) return;

  CLOCK_POSITIONS.forEach((pos) => {
    if (pos !== "hidden") el.classList.remove(`time-${pos}`);
  });
  el.classList.remove("invisible");

  if (position === "hidden" || !CLOCK_POSITIONS.includes(position)) {
    el.classList.add("invisible");
    return;
  }

  el.classList.add(`time-${position}`);
}

function applyVerseBox(mode) {
  const box = document.getElementById("box");
  if (!box) return;

  box.classList.remove("paused", "nobox");
  if (mode === "noripple") {
    box.classList.add("paused");
  } else if (mode === "nobox") {
    box.classList.add("nobox");
  }
}

function renderScreen(settings) {
  const {
    version: ver,
    version2: ver2,
    twentyFourHour: h24,
    clockPosition: clockPos,
    monthLocale: monthLoc,
    forceBackgroundSetting: forceBg,
    customFile: custom,
    staticBg: staticB,
    verseBox: boxMode,
  } = settings;

  const nextBG = document.getElementById("background1");
  const currBG = document.getElementById("background2");
  const overlayBG = document.getElementById("background3");

  if (!getBackgroundSource(overlayBG)) {
    setBackgroundContent(overlayBG, NightSky, staticB);
  }

  setInitialBG(
    new Date(),
    currBG,
    nextBG,
    overlayBG,
    forceBg,
    custom,
    staticB,
    false,
  );
  applyClockPosition(clockPos);
  applyVerseBox(boxMode);
  lastClockPosition = clockPos;
  lastVerseBox = boxMode;

  grabVerse(ver, ver2);
  lastTickAt = Date.now();

  clearInterval(intervalID);
  intervalID = setInterval(() => {
    tick(
      currBG,
      nextBG,
      overlayBG,
      ver,
      ver2,
      clockPos,
      h24,
      monthLoc,
      forceBg,
      custom,
      staticB,
      boxMode,
    );
  }, 1000);
}

function tick(
  currBG,
  nextBG,
  overlayBG,
  ver,
  ver2,
  clockPos,
  h24,
  monthLoc,
  forceBg,
  custom,
  staticB,
  boxMode,
) {
  const nowMs = Date.now();
  const gap = nowMs - lastTickAt;
  if (gap >= SLEEP_GAP_MS) {
    lastTickAt = nowMs;
    if (runtime && nowMs >= suppressWakeUntil && !wePaused) {
      bindPropertyListener();
      recoverAfterWake(runtime, true);
      return;
    }
  }
  lastTickAt = nowMs;

  if (clockPos !== lastClockPosition) {
    lastClockPosition = clockPos;
    applyClockPosition(clockPos);
  }

  if (boxMode !== lastVerseBox) {
    lastVerseBox = boxMode;
    applyVerseBox(boxMode);
  }

  const now = new Date();

  if (now.getSeconds() === 30 && now.getMinutes() % 30 === 0) {
    grabVerse(ver, ver2);
  }

  updateClock(now, h24, monthLoc);
  updateBackground(now, currBG, nextBG, overlayBG, forceBg, custom, staticB);
}

function updateClock(date, h24, monthLoc) {
  const clockKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${h24 ? 1 : 0}-${monthLoc}`;
  if (clockKey === lastClockKey) return;
  lastClockKey = clockKey;

  const hours = h24 ? date.getHours() : date.getHours() % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  let monthLabel;
  try {
    monthLabel = date
      .toLocaleString(monthLoc || "en-US", { month: "short" })
      .toUpperCase();
  } catch (_) {
    monthLabel = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
  }

  document.getElementById("clock").textContent = `${hours}:${minutes}`;
  document.getElementById("day").textContent = date.getDate();
  document.getElementById("month").textContent = monthLabel;
  document.getElementById("year").textContent = date.getFullYear();
}

function updateBackground(
  date,
  currBG,
  nextBG,
  overlayBG,
  forceBg,
  custom,
  staticB,
) {
  const hour = date.getHours();
  const isNight = hour >= 18 || hour < 6;
  const day = date.getDay();

  const bgKey =
    forceBg !== "none"
      ? `force:${forceBg}:${custom}:${staticB}`
      : `cycle:${day}:${isNight ? "n" : "d"}:${staticB}`;

  if (bgKey === lastBgKey) return;
  lastBgKey = bgKey;

  if (forceBg !== "none") {
    clearBgFadeTimeout();
    forceBackground(overlayBG, forceBg, custom, staticB);
    removeInvisibleClass(overlayBG);
    return;
  }

  if (isNight) {
    clearBgFadeTimeout();
    setBackgroundContent(overlayBG, NightSky, staticB);
    removeInvisibleClass(overlayBG);
    bgChooser(day, nextBG, staticB);
    setBackgroundContent(currBG, getBackgroundSource(nextBG), staticB);
    return;
  }

  addInvisibleClass(overlayBG);
  bgChooser(day, nextBG, staticB);

  const nextSrc = getBackgroundSource(nextBG);
  const currSrc = getBackgroundSource(currBG);

  if (currSrc === nextSrc) {
    clearBgFadeTimeout();
    removeInvisibleClass(currBG);
    return;
  }

  clearBgFadeTimeout();
  addInvisibleClass(currBG);
  bgFadeTimeoutId = setTimeout(() => {
    bgFadeTimeoutId = null;
    setBackgroundContent(currBG, nextSrc, staticB);
    removeInvisibleClass(currBG);
  }, 5000);
}

function setInitialBG(
  date,
  currBG,
  nextBG,
  overlayBG,
  forceBg,
  custom,
  staticB,
  forceRemount = false,
) {
  const hour = date.getHours();
  const isNight = hour >= 18 || hour < 6;
  const day = date.getDay();
  const forceOpts = { force: forceRemount };

  lastBgKey =
    forceBg !== "none"
      ? `force:${forceBg}:${custom}:${staticB}`
      : `cycle:${day}:${isNight ? "n" : "d"}:${staticB}`;

  if (forceBg !== "none") {
    forceBackground(overlayBG, forceBg, custom, staticB, forceOpts);
    removeInvisibleClass(overlayBG);
    return;
  }

  if (isNight) {
    setBackgroundContent(overlayBG, NightSky, staticB, forceOpts);
    removeInvisibleClass(overlayBG);
  } else {
    addInvisibleClass(overlayBG);
  }

  bgChooser(day, currBG, staticB);
  if (forceRemount) {
    const src = getBackgroundSource(currBG);
    setBackgroundContent(currBG, src, staticB, { force: true });
  }
  removeInvisibleClass(currBG);
}
