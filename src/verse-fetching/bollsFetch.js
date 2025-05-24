const axios = require("axios");
import defaultVerse from "./defaultVerse";
import { bookIDs } from "../bookIDs";
import dataParser from "./helperFunctions";

async function bollsFetch(translation, triedAgain = false) {
  try {
    await axios.get("https://votd-grabber.onrender.com/scrape").then((res) => {
      if (res.status !== 200) {
        throw new Error("Non-200 status.");
      }

      // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
      const [book, chapterString, verseRange, verseString] = dataParser(res.data[0]);
      
      // Fetch from Bolls Bible API.
      fetch(
        `https://bolls.life/get-text/${translation}/${bookIDs[book]}/${chapterString}/`
      )
        .then((request) => request.json())
        .then((chapter) => {
          // The string we're gonna output in the end.
          var output = "";

          // Account for either a single verse or a verse range.
          // Add the targeted verse's text to the output.
          if (verseRange.length === 1) {
            output += chapter.filter((item) => item.verse === verseRange[0])[0]
              .text;
          } else {
            for (let i = verseRange[0]; i <= verseRange[1]; i++) {
              output +=
                chapter.filter((item) => item.verse === i)[0].text + " ";
            }
            output = output.substring(0, output.length - 1);
          }

          // Get rid of Strong's Numbers (only for some versions), Superscripts (for notes), and Bold text (for titles)
          output = output.replace(
            /<S>.*?<\/S>|<sup>.*?<\/sup>|<b>.*?<\/b>/g,
            ""
          );

          // Remove italics tags, but don't remove the contents
          output = output.replace(/<\/?i>/g, "");

          // Remove unpaired quotes
            // if (output.split("'").length - 1 === 1) {
            //   output = output.replace("'", "");
            // }
            // if (output.split("\"").length - 1 === 1) {
            //   output = output.replace("\"", "");
            // }

          // Remove weird symbols, etc.
          output = output.replace(/ [^\p{L}\p{N}\s.,!?'"(){}[\]:;]/gu, "");

          // Fetch the book title (may change depending on language)
          fetch(`https://bolls.life/get-books/${translation}/`)
            .then((request) => request.json())
            .then((version) => {
              var bookName = version.filter(
                (item) => item.bookid === bookIDs[book]
              )[0].name;

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
        bollsFetch(translation, true);
      }, 15000);
    } else {
      console.error("Verse fetch failed, showing default verse. - ", error);
      defaultVerse();
    }
  }
}

export default bollsFetch;