const axios = require("axios");
import defaultVerse from "./defaultVerse";
import { bookIDs } from "../bookIDs";
import dataParser from "./helperFunctions";
import {
  AXIOS_TIMEOUT,
  beginVerseFetch,
  displayVerse,
  fetchWithTimeout,
  isVerseFetchCurrent,
  showCachedVerseIfAny,
} from "./fetchUtils";
import {
  bollsPsalmCandidates,
  extractBollsVerseText,
} from "./psalmMap";

function cleanBollsText(output) {
  output = output.replace(/<S>.*?<\/S>|<sup>.*?<\/sup>|<b>.*?<\/b>/g, "");
  output = output.replace(/<\/?i>/g, "");
  output = output.replace(/ [^\p{L}\p{N}\s.,!?'"(){}[\]:;]/gu, "");
  return output;
}

async function bollsFetch(translation, triedAgain = false, gen = null) {
  if (gen == null) {
    gen = beginVerseFetch();
    showCachedVerseIfAny(translation);
  }

  try {
    const res = await axios.get("https://votd-grabber.onrender.com/scrape", {
      timeout: AXIOS_TIMEOUT,
    });

    if (!isVerseFetchCurrent(gen)) return;

    if (res.status !== 200) {
      throw new Error("Non-200 status.");
    }

    const [book, chapterString, verseRange, verseString] = dataParser(
      res.data[0],
    );

    const bookId = bookIDs[book];
    if (bookId == null) {
      throw new Error(`Unknown book: ${book}`);
    }

    const candidates = bollsPsalmCandidates(
      translation,
      book,
      chapterString,
      verseRange,
    );

    let output = null;

    let lastErr = null;
    for (const candidate of candidates) {
      try {
        const chapterRes = await fetchWithTimeout(
          `https://bolls.life/get-text/${translation}/${bookId}/${candidate.chapterString}/`,
        );
        if (!isVerseFetchCurrent(gen)) return;
        if (!chapterRes.ok) {
          throw new Error(`Chapter fetch ${chapterRes.status}`);
        }

        const chapter = await chapterRes.json();
        if (!isVerseFetchCurrent(gen)) return;

        output = cleanBollsText(
          extractBollsVerseText(chapter, candidate.verseRange),
        );
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (output == null) {
      throw lastErr || new Error("Verse not found after Psalm remap attempts");
    }

    const booksRes = await fetchWithTimeout(
      `https://bolls.life/get-books/${translation}/`,
    );
    if (!isVerseFetchCurrent(gen)) return;
    if (!booksRes.ok) throw new Error(`Books fetch ${booksRes.status}`);

    const version = await booksRes.json();
    if (!isVerseFetchCurrent(gen)) return;

    const bookMeta = version.find((item) => item.bookid === bookId);
    const bookName = bookMeta?.name || book;

    // Keep the familiar Protestant reference in the citation when we remapped
    // internally, so the label still matches VOTD (e.g. Psalm 42:8).
    displayVerse(output, `${bookName} ${chapterString}:${verseString}`, {
      gen,
      translation,
    });
  } catch (error) {
    if (!isVerseFetchCurrent(gen)) return;

    if (!triedAgain) {
      setTimeout(() => {
        bollsFetch(translation, true, gen);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse(gen, translation);
    }
  }
}

export default bollsFetch;
