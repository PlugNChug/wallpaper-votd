const axios = require("axios");
import defaultVerse from "./verse-fetching/defaultVerse";
import bollsFetch from "./verse-fetching/bollsFetch";
import helloaoFetch from "./verse-fetching/helloaoFetch";
import dataParser from "./verse-fetching/helperFunctions";

export async function grabVerse(translation, translation2) {
  if (translation === "VOTD") {
    votd(translation);
    return;
  }

  if (["eng_asv", "BSB", "fra_sbl", "GREEK"].includes(translation)) {
    helloaoFetch(translation, translation2);
  } else {
    bollsFetch(translation);
  }
}

export async function grabVerseAgain(translation) {
  if (translation === "VOTD") {
    votd(translation);
    return;
  }

  if (["eng_asv", "BSB", "fra_sbl"].includes(translation)) {
    helloaoFetch(translation, translation);
  } else {
    bollsFetch(translation);
  }
}

async function votd(translation, triedAgain = false) {
  try {
    await axios.get("https://votd-grabber.onrender.com/scrape").then((res) => {
      // If no connection, or some sort of error occurred when connecting, abort and do the default verse: Proverbs 3:5-6
      if (res.status !== 200) {
        defaultVerse();
        return;
      }
  
      // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
      const [book, chapterString, verseRange, verseString] = dataParser(res.data[0]);

      if (book === "Song") book = "Song of Solomon";
  
      // Set the corresponding elements to the loaded verse and chapter.
      document.getElementById("verse").innerHTML = res.data[1];
      document.getElementById(
        "source"
      ).innerHTML = `${book} ${chapterString}:${verseString}`;
  
      // Then, set the visibility of elements.
      document.getElementById("load").classList.add("invisible");
      setTimeout(() => {
        document.getElementById("verse").classList.add("textfade");
        document.getElementById("source").classList.add("textfade");
        document.getElementById("verse").classList.remove("invisible");
        document.getElementById("source").classList.remove("invisible");
      }, 1250);
    });
  } catch (error) {
    if (!triedAgain) {
      setTimeout(() => {
        votd(translation, true);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse();
    }
  }
}
