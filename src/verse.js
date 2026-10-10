const axios = require("axios");
import defaultVerse from "./verse-fetching/defaultVerse";
import bollsFetch from "./verse-fetching/bollsFetch";
import apiBibleFetch from "./verse-fetching/apiBibleFetch";
import helloaoFetch from "./verse-fetching/helloaoFetch";
import dataParser from "./verse-fetching/helperFunctions";
import {
  AXIOS_TIMEOUT,
  beginVerseFetch,
  displayVerse,
  isVerseFetchCurrent,
  showCachedVerseIfAny,
} from "./verse-fetching/fetchUtils";

/**
 * Still only on helloao (no matching Bolls edition):
 * - fra_sbl — French SBL
 * - GREEK — SBL Greek NT (grc_sbl1); Bolls has TISCH/TR/LXX instead
 *
 * API.Bible (user API key required):
 * - NIV2011 — NIV (no longer on Bolls; not on helloao; not on Biblia API)
 *
 * Now on Bolls (migrated off helloao):
 * - eng_asv → ASV
 * - BSB → BSB
 */
const HELLOAO_ONLY = new Set(["fra_sbl", "GREEK"]);
const API_BIBLE_ONLY = new Set(["NIV2011"]);

/** Map legacy / UI ids onto Bolls short_name values. */
const BOLLS_IDS = {
  eng_asv: "ASV",
};

function resolveBollsId(translation) {
  return BOLLS_IDS[translation] || translation;
}

function dispatchTranslation(translation, translation2) {
  if (translation === "VOTD") {
    votd(translation);
    return;
  }

  if (API_BIBLE_ONLY.has(translation)) {
    apiBibleFetch(translation);
    return;
  }

  if (HELLOAO_ONLY.has(translation)) {
    helloaoFetch(translation, translation2);
    return;
  }

  bollsFetch(resolveBollsId(translation));
}

export async function grabVerse(translation, translation2) {
  dispatchTranslation(translation, translation2);
}

export async function grabVerseAgain(translation) {
  dispatchTranslation(translation, translation);
}

async function votd(translation, triedAgain = false, gen = null) {
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
      defaultVerse(gen, translation);
      return;
    }

    let [book, chapterString, , verseString] = dataParser(res.data[0]);

    if (book === "Song") book = "Song of Solomon";

    displayVerse(res.data[1], `${book} ${chapterString}:${verseString}`, {
      gen,
      translation,
    });
  } catch (error) {
    if (!isVerseFetchCurrent(gen)) return;

    if (!triedAgain) {
      setTimeout(() => {
        votd(translation, true, gen);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse(gen, translation);
    }
  }
}
