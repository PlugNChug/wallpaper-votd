const axios = require("axios");
import defaultVerse from "./defaultVerse";
import { bookCodes } from "../bookIDs";
import dataParser from "./helperFunctions";
import { getApiBibleKey } from "./apiBibleAuth";
import {
  AXIOS_TIMEOUT,
  beginVerseFetch,
  displayVerse,
  fetchWithTimeout,
  isVerseFetchCurrent,
  showCachedVerseIfAny,
} from "./fetchUtils";

const API_BASE = "https://rest.api.bible/v1";
/** Well-known NIV text bible id; confirmed via /bibles when possible. */
const NIV_FALLBACK_ID = "78a9f6124f344018-01";
const FUMS_DEVICE_KEY = "votd-api-bible-did";

let cachedNivBibleId = null;

function missingKeyMessage() {
  return (
    "NIV requires a free API.Bible key. Create a Starter (non-commercial) app at https://api.bible/sign-up, add NIV as one of your copyrighted Bibles, then paste the key under API.Bible Key in the wallpaper settings."
  );
}

function invalidKeyMessage() {
  return (
    "API.Bible rejected the key, or NIV is not enabled for this app. Confirm the key and that NIV was added when you created the app."
  );
}

function normalizeBookName(book) {
  if (book === "Song") return "Song";
  if (book === "Song of Solomon" || book === "SongofSolomon") return "Song";
  return book.replace(/\s+/g, "");
}

function resolveBookCode(book) {
  const normalized = normalizeBookName(book);
  return bookCodes[normalized] || bookCodes[book] || null;
}

function buildPassageId(bookCode, chapterString, verseRange) {
  const start = `${bookCode}.${chapterString}.${verseRange[0]}`;
  if (verseRange.length === 1 || verseRange[0] === verseRange[1]) {
    return start;
  }
  const endVerse = verseRange[1] ?? verseRange[0];
  return `${start}-${bookCode}.${chapterString}.${endVerse}`;
}

function cleanApiBibleText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/¶/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureDeviceId() {
  try {
    let id = localStorage.getItem(FUMS_DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(FUMS_DEVICE_KEY, id);
    }
    return id;
  } catch (_) {
    return `d-${Date.now()}`;
  }
}

/** Fair Use Management System ping required by API.Bible for displayed content. */
function reportFums(token) {
  if (!token) return;
  try {
    const dId = ensureDeviceId();
    const sId = `s-${new Date().toISOString().slice(0, 10)}`;
    const url =
      `https://fums.api.bible/f3?t=${encodeURIComponent(token)}` +
      `&dId=${encodeURIComponent(dId)}` +
      `&sId=${encodeURIComponent(sId)}`;
    // Fire-and-forget; failures must not break verse display.
    if (typeof fetch === "function") {
      fetch(url, { mode: "no-cors", keepalive: true }).catch(() => {});
    } else {
      const img = new Image();
      img.src = url;
    }
  } catch (_) {
    /* ignore */
  }
}

async function apiGet(path, apiKey) {
  return fetchWithTimeout(`${API_BASE}${path}`, {
    headers: { "api-key": apiKey },
  });
}

async function resolveNivBibleId(apiKey) {
  if (cachedNivBibleId) return cachedNivBibleId;

  const res = await apiGet("/bibles", apiKey);
  if (res.status === 401 || res.status === 403) {
    const err = new Error("Unauthorized");
    err.status = res.status;
    throw err;
  }
  if (!res.ok) throw new Error(`Bibles list ${res.status}`);

  const payload = await res.json();
  const list = payload.data || [];
  const niv = list.find(
    (b) =>
      b.abbreviation === "NIV" ||
      b.abbreviationLocal === "NIV" ||
      /new international version/i.test(b.name || ""),
  );

  cachedNivBibleId = niv?.id || NIV_FALLBACK_ID;
  return cachedNivBibleId;
}

async function apiBibleFetch(translation, triedAgain = false, gen = null) {
  if (gen == null) {
    gen = beginVerseFetch();
    showCachedVerseIfAny(translation);
  }

  const apiKey = getApiBibleKey();
  if (!apiKey) {
    displayVerse(missingKeyMessage(), "API.Bible key needed for NIV", {
      fade: true,
      cache: false,
      gen,
      translation,
    });
    return;
  }

  try {
    const res = await axios.get("https://votd-grabber.onrender.com/scrape", {
      timeout: AXIOS_TIMEOUT,
    });

    if (!isVerseFetchCurrent(gen)) return;

    if (res.status !== 200) {
      throw new Error("Non-200 status.");
    }

    let [book, chapterString, verseRange, verseString] = dataParser(
      res.data[0],
    );
    if (book === "Song of Solomon") book = "Song";

    const bookCode = resolveBookCode(book);
    if (!bookCode) {
      throw new Error(`Unknown book: ${book}`);
    }

    const bibleId = await resolveNivBibleId(apiKey);
    if (!isVerseFetchCurrent(gen)) return;

    const passageId = buildPassageId(bookCode, chapterString, verseRange);
    const isRange =
      verseRange.length > 1 && verseRange[0] !== verseRange[1];
    const contentPath = isRange
      ? `/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}`
      : `/bibles/${encodeURIComponent(bibleId)}/verses/${encodeURIComponent(passageId)}`;

    const qs =
      "?content-type=text&include-notes=false&include-titles=false" +
      "&include-chapter-numbers=false&include-verse-numbers=false";

    const contentRes = await apiGet(`${contentPath}${qs}`, apiKey);
    if (!isVerseFetchCurrent(gen)) return;

    if (contentRes.status === 401 || contentRes.status === 403) {
      cachedNivBibleId = null;
      displayVerse(invalidKeyMessage(), "NIV — API.Bible access issue", {
        fade: true,
        cache: false,
        gen,
        translation,
      });
      return;
    }

    if (!contentRes.ok) {
      throw new Error(`Content fetch ${contentRes.status}`);
    }

    const payload = await contentRes.json();
    if (!isVerseFetchCurrent(gen)) return;

    const output = cleanApiBibleText(payload.data?.content);
    if (!output) {
      throw new Error("Empty API.Bible content");
    }

    reportFums(payload.meta?.fumsToken);

    const reference =
      payload.data?.reference ||
      `${book === "Song" ? "Song of Solomon" : book} ${chapterString}:${verseString}`;

    displayVerse(output, reference, {
      gen,
      translation,
    });
  } catch (error) {
    if (!isVerseFetchCurrent(gen)) return;

    if (error?.status === 401 || error?.status === 403) {
      cachedNivBibleId = null;
      displayVerse(invalidKeyMessage(), "NIV — API.Bible access issue", {
        fade: true,
        cache: false,
        gen,
        translation,
      });
      return;
    }

    if (!triedAgain) {
      setTimeout(() => {
        apiBibleFetch(translation, true, gen);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse(gen, translation);
    }
  }
}

export default apiBibleFetch;
