const axios = require("axios");

function defaultVerse() {
  document.getElementById("load").style.visibility = "hidden";
  document.getElementById("verse").innerHTML = "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.";
  document.getElementById("source").innerHTML = "Proverbs 3:5-6";
}

async function grabVerse() {
  try {
    await axios.get("https://votd-grabber.onrender.com/scrape").then((res) => {
      // If no connection, or some sort of error occurred when connecting, abort and do the default verse: Proverbs 3:5-6
      if (res.status !== 200) {
        defaultVerse();
        return;
      }
  
      // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
      const link = res.data;
      const parseableString = link.split("/")[link.split("/").length - 1];
  
      // Get the first item in the further split parseableString to obtain the string for book and chapter
      const location = parseableString.split(".")[0];
      // Get the second item in the further split parseableString to obtain a verse number string
      const verse = parseableString.split(".")[1];
  
      axios.get(`https://bible-api.com/${location}:${verse}?translation=web`).then((res) => {
        // If no connection, or some sort of error occurred when connecting, abort and do the default verse: Proverbs 3:5-6
        if (res.status !== 200) {
          defaultVerse();
          return;
        }
  
        var book = "NULL";
        var chapter = "NULL";
        var strIndex = 1;
        while (!isNaN(location.substring(location.length - 1 - strIndex))) {
          strIndex++;
        }

        book = location.substring(0, location.length - strIndex);
        chapter = location.substring(location.length - strIndex);

        // Format numbered books (e.g. 1 Corinthians)
        let bookStrIndex = 1;
        let numberedBookNum = "";
        while (!isNaN(book.substring(0, bookStrIndex))) {
          bookStrIndex++;
          numberedBookNum += book.substring(0, bookStrIndex - 1);
        }
        if (numberedBookNum.length > 0) {
          numberedBookNum += " ";
        }

        book = numberedBookNum + book.substring(bookStrIndex - 1);
  
        // Set the corresponding elements to the loaded verse and chapter.
        document.getElementById("load").style.visibility = "hidden";
        document.getElementById("verse").innerHTML = res.data.text;
        document.getElementById("source").innerHTML = `${book} ${chapter}:${verse}`;
      });
    });
  } catch (error) {
    defaultVerse();
  }
}

export default grabVerse;
