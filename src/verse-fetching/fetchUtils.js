export const AXIOS_TIMEOUT = 20000;
export const FETCH_TIMEOUT = 20000;
export const VERSE_CACHE_KEY = "votd-verse-cache";
export const SETTINGS_CACHE_KEY = "votd-settings-cache";

let verseFetchGen = 0;

/** Bump generation so in-flight handlers can bail out. Returns the new gen. */
export function beginVerseFetch() {
  return ++verseFetchGen;
}

export function isVerseFetchCurrent(gen) {
  return gen === verseFetchGen;
}

/**
 * fetch with AbortController timeout.
 */
export function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const parentSignal = options.signal;

  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(id);
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

export function saveVerseCache(text, source, translation) {
  try {
    localStorage.setItem(
      VERSE_CACHE_KEY,
      JSON.stringify({
        text,
        source,
        translation: translation || null,
        ts: Date.now(),
      }),
    );
  } catch (_) {
    /* quota / private mode */
  }
}

export function loadVerseCache() {
  try {
    const raw = localStorage.getItem(VERSE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function saveSettingsCache(settings) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (_) {
    /* ignore */
  }
}

export function loadSettingsCache() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Write verse + source to the DOM and optionally cache.
 * @param {{ fade?: boolean, cache?: boolean, gen?: number, translation?: string }} opts
 */
export function displayVerse(text, source, opts = {}) {
  const { fade = true, cache = true, gen, translation } = opts;
  if (gen != null && !isVerseFetchCurrent(gen)) return;

  document.getElementById("verse").innerHTML = text;
  document.getElementById("source").innerHTML = source;
  document.getElementById("load").classList.add("invisible");

  if (cache) saveVerseCache(text, source, translation);

  if (!fade) {
    document.getElementById("verse").classList.add("textfade");
    document.getElementById("source").classList.add("textfade");
    document.getElementById("verse").classList.remove("invisible");
    document.getElementById("source").classList.remove("invisible");
    return;
  }

  setTimeout(() => {
    if (gen != null && !isVerseFetchCurrent(gen)) return;
    document.getElementById("verse").classList.add("textfade");
    document.getElementById("source").classList.add("textfade");
    document.getElementById("verse").classList.remove("invisible");
    document.getElementById("source").classList.remove("invisible");
  }, 1250);
}

/**
 * Show cached verse only when it matches the requested translation.
 * Avoids flashing English after wake / version switch.
 */
export function showCachedVerseIfAny(translation) {
  const cache = loadVerseCache();
  if (
    cache?.text &&
    cache?.source &&
    (!translation || cache.translation === translation)
  ) {
    displayVerse(cache.text, cache.source, {
      fade: false,
      cache: false,
      translation: cache.translation,
    });
    return true;
  }
  return false;
}
