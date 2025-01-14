const axios = require("axios");
import defaultVerse from "./defaultVerse";
import { bookIDs, bookCodes } from "../bookIDs";
import { grabVerseAgain } from "../verse";

async function helloaoFetch(translation, translation2, triedAgain = false) {
  try {
    await axios.get("https://votd-grabber.onrender.com/scrape").then((res) => {
      if (res.status !== 200) {
        throw new Error("Non-200 status.");
      }

      // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
      const link = res.data[0];
      const parseableString = link.split("/")[link.split("/").length - 1];
  
      // Get the first item in the further split parseableString to obtain the string for book and chapter
      const locationString = parseableString.split(".")[0];

      var book = "NULL";
      var chapterString = "NULL";
      var strIndex = 1;
      while (!isNaN(locationString.substring(locationString.length - 1 - strIndex))) {
        strIndex++;
      }
      book = locationString.substring(0, locationString.length - strIndex);
      chapterString = locationString.substring(locationString.length - strIndex);


      // Get the second item in the further split parseableString to obtain a verse number range.
      // This range can either be a single verse or an actual range of verses.
      // String representations of numbers will be converted to actual numbers.
      const verseString = parseableString.split(".")[1];
      const verseRange = verseString.split("-").map(Number);

      if (translation === "GREEK") {
        if (bookIDs[book] < 40) {
          grabVerseAgain(translation2);
          return;
        } else {
          translation = "grc_sbl1";
        }
      }
      
      // Fetch from Free Use Bible API. This option is better for ASV (since Bolls Bible API doesn't have ASV) and BSB (No intro blurbs in Psalms)
      fetch(`https://bible.helloao.org/api/${translation}/${bookCodes[book]}/${chapterString}.json`)
      .then(request => request.json())
      .then(chapter => {
        // The string we're gonna output in the end.
        var output = "";


        // What we're looking for is a bit nested within the JSON...
        var contents = chapter.chapter.content;
        
        // Account for either a single verse or a verse range.
        // Add the targeted verse's text to the output. The text itself is also pretty nested in the data...
        if (verseRange.length === 1) {
          output += contents
          .filter(item => item.type === "verse" && item.number === verseRange[0])
          .map(verse => ({
              verse: verse.content
                  .map(part => (typeof part === "string" ? part : part.text || ""))
                  .join(" ")
          }))[0].verse;
        } else {
          for (let i = verseRange[0]; i <= verseRange[1]; i++) {
            output += contents
            .filter(item => item.type === "verse" && item.number === i)
            .map(verse => ({
                verse: verse.content
                    .map(part => (typeof part === "string" ? part : part.text || ""))
                    .join(" ")
            }))[0].verse + " ";
          }
          output = output.substring(0, output.length - 1);
        }
        // console.log(output);
  
        // Fetch the book title (may change depending on language)
        fetch(`https://bible.helloao.org/api/${translation}/books.json`)
        .then((request) => request.json())
        .then((version) => {
          var bookName = version.books.filter(
            (item) => item.id === bookCodes[book]
          )[0].commonName;

          // Set the corresponding elements to the loaded verse and chapter.
          document.getElementById("verse").innerHTML = output;
          document.getElementById(
            "source"
          ).innerHTML = `${bookName} ${chapterString}:${verseString}`;

          // Then, set the visibility of elements.
          document.getElementById("load").classList.add("invisible");
          setTimeout(() => {
            document.getElementById("verse").classList.add("textfade");
            document.getElementById("source").classList.add("textfade");
            document.getElementById("verse").classList.remove("invisible");
            document.getElementById("source").classList.remove("invisible");
          }, 1250);
        });
      });
    });
  } catch (error) {
    // If some error happened (like no connection), try again in 15 seconds.
    // If we already tried again, abort and do the default verse: Proverbs 3:5-6
    if (!triedAgain) {
      setTimeout(() => {
        helloaoFetch(translation, translation2, true);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse();
    }
  }
}

export default helloaoFetch;
