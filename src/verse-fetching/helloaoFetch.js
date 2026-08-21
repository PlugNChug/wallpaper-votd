const axios = require("axios");
import defaultVerse from "./defaultVerse";
import { bookIDs, bookCodes } from "../bookIDs";
import { grabVerseAgain } from "../verse";
import dataParser from "./helperFunctions";
import {
  AXIOS_TIMEOUT,
  beginVerseFetch,
  displayVerse,
  fetchWithTimeout,
  isVerseFetchCurrent,
  showCachedVerseIfAny,
} from "./fetchUtils";

async function helloaoFetch(
  translation,
  translation2,
  triedAgain = false,
  gen = null,
) {
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

    let apiTranslation = translation;
    if (translation === "GREEK") {
      if (bookIDs[book] < 40) {
        grabVerseAgain(translation2);
        return;
      }
      apiTranslation = "grc_sbl1";
    }

    const chapterRes = await fetchWithTimeout(
      `https://bible.helloao.org/api/${apiTranslation}/${bookCodes[book]}/${chapterString}.json`,
    );
    if (!isVerseFetchCurrent(gen)) return;
    if (!chapterRes.ok) throw new Error(`Chapter fetch ${chapterRes.status}`);

    const chapter = await chapterRes.json();
    if (!isVerseFetchCurrent(gen)) return;

    let output = "";
    const contents = chapter.chapter.content;

    const verseText = (n) =>
      contents
        .filter((item) => item.type === "verse" && item.number === n)
        .map((verse) => ({
          verse: verse.content
            .map((part) => (typeof part === "string" ? part : part.text || ""))
            .join(" "),
        }))[0].verse;

    if (verseRange.length === 1) {
      output += verseText(verseRange[0]);
    } else {
      for (let i = verseRange[0]; i <= verseRange[1]; i++) {
        output += verseText(i) + " ";
      }
      output = output.substring(0, output.length - 1);
    }

    const booksRes = await fetchWithTimeout(
      `https://bible.helloao.org/api/${apiTranslation}/books.json`,
    );
    if (!isVerseFetchCurrent(gen)) return;
    if (!booksRes.ok) throw new Error(`Books fetch ${booksRes.status}`);

    const version = await booksRes.json();
    if (!isVerseFetchCurrent(gen)) return;

    const bookName = version.books.filter(
      (item) => item.id === bookCodes[book],
    )[0].commonName;

    displayVerse(output, `${bookName} ${chapterString}:${verseString}`, {
      gen,
      translation,
    });
  } catch (error) {
    if (!isVerseFetchCurrent(gen)) return;

    if (!triedAgain) {
      setTimeout(() => {
        helloaoFetch(translation, translation2, true, gen);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse(gen, translation);
    }
  }
}

export default helloaoFetch;
