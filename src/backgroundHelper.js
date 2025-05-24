import HornPeak from "./assets/HornPeak.jpg";
import NightSky from "./assets/NightSky.jpg";
import BlueGradient from "./assets/BlueGradient.svg";
import OrangeWaves from "./assets/OrangeWaves.svg";
import GreenTiles from "./assets/GreenTiles.svg";
import PinkWaves from "./assets/PinkWaves.svg";
import YellowZigZags from "./assets/YellowZigZags.svg";
import SoftGradient from "./assets/SoftGradient.svg";

// -----------------------------------------------------------------------------
//  Background lookup tables
// -----------------------------------------------------------------------------

const DAILY_BACKGROUNDS = [
  BlueGradient,      // Sunday
  OrangeWaves,       // Monday
  GreenTiles,        // Tuesday
  PinkWaves,         // Wednesday
  YellowZigZags,     // Thursday
  SoftGradient,      // Friday
  HornPeak,          // Saturday
];

const FORCE_MAP = {
  blue: BlueGradient,
  orange: OrangeWaves,
  green: GreenTiles,
  pink: PinkWaves,
  yellow: YellowZigZags,
  gradient: SoftGradient,
  mountain: HornPeak,
  night: NightSky,
};

// -----------------------------------------------------------------------------
//  DOM helpers
// -----------------------------------------------------------------------------

export const removeInvisibleClass   = (el) => el.classList.remove("invisible");
export const addInvisibleClass      = (el) => el.classList.add("invisible");
export const containsInvisibleClass = (el) => el.classList.contains("invisible");

export function getBackgroundSource(container) {
  const child = container.firstElementChild;
  if (!child) return null;
  if (child.tagName === "OBJECT") return child.data;
  if (child.tagName === "VIDEO") return child.currentSrc || child.src;
  return child.src; // IMG
}

// -----------------------------------------------------------------------------
//  Static-background helpers
// -----------------------------------------------------------------------------

const STATIC_PATCH_ID = "__static_patch";

function freezeSVG(doc) {
  if (!doc || doc.getElementById(STATIC_PATCH_ID)) return;
  const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
  style.id = STATIC_PATCH_ID;
  style.textContent = `*{animation:none!important;transition:none!important;}`;
  doc.documentElement.appendChild(style);
}

function unfreezeSVG(doc) {
  doc?.getElementById(STATIC_PATCH_ID)?.remove();
}

function reconcileStaticMode(element, staticbg) {
  if (!element) return;

  switch (element.tagName) {
    case "OBJECT": {
      const apply = () => {
        const doc = element.contentDocument;
        if (!doc) return;
        staticbg ? freezeSVG(doc) : unfreezeSVG(doc);
      };
      if (element.contentDocument) {
        apply();
      } else {
        element.addEventListener("load", apply, { once: true });
      }
      break;
    }
    case "VIDEO": {
      if (staticbg) {
        element.pause();
      } else {
        const playPromise = element.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {/* autoplay might be blocked – ignore */});
        }
      }
      break;
    }
    default: /* IMG – nothing to freeze */ break;
  }
}

// -----------------------------------------------------------------------------
//  Element factory
// -----------------------------------------------------------------------------

function createBackgroundElement(src, staticbg) {
  const ext = src.split(".").pop().toLowerCase();
  const isSVG   = ext === "svg";
  const isVideo = ["mp4", "webm", "ogg", "ogv"].includes(ext);
  const el = document.createElement(isVideo ? "video" : isSVG ? "object" : "img");

  if (isVideo) {
    el.src = src;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.style.objectFit = "cover";
    if (staticbg) el.pause();
  } else if (isSVG) {
    el.type = "image/svg+xml";
    el.data = src;
    reconcileStaticMode(el, staticbg); // will freeze on load if needed
  } else {
    el.src = src; // img, gif
  }

  el.style.width = el.style.height = "100%";
  return el;
}

// -----------------------------------------------------------------------------
//  Core API
// -----------------------------------------------------------------------------

/**
 * Ensures that the background inside `container` matches the requested `src`
 * and that it immediately honours the `staticbg` flag (freeze/unfreeze).
 */
export function setBackgroundContent(container, src, staticbg) {
  // Update existing element’s static/animated state
  reconcileStaticMode(container.firstElementChild, staticbg);

  // Swap element only if the asset actually changes
  if (getBackgroundSource(container) === src) return;

  container.innerHTML = "";
  container.appendChild(createBackgroundElement(src, staticbg));
}

export function bgChooser(day, container, staticbg) {
  setBackgroundContent(container, DAILY_BACKGROUNDS[day % 7], staticbg);
}

export function forceBackground(container, key, custom, staticbg) {
  const src = (key === "customimage" || key === "customvideo") ? custom : FORCE_MAP[key] || NightSky;
  setBackgroundContent(container, src, staticbg);
}
