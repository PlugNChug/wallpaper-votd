const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.use(cors()); // Enable CORS for all routes

app.get("/scrape", async (req, res) => {
  try {
    const response = await axios.get("https://www.verseoftheday.com/", {
      responseType: "document",
    });
    const $ = cheerio.load(response.data);

    var links = [];

    $(".reference a").each(function () {
      var link = $(this).attr("href");
      links.push(link);
    });

    const verseElement = $(".bilingual-left")
      .clone()
      .find(".reference")
      .remove()
      .end();

    // Proper capitalization of words like "LORD"
    verseElement.find(".small-caps").each(function () {
      const text = $(this).text().toUpperCase(); // Convert the text to uppercase
      $(this).replaceWith(text); // Replace the <span> element with the uppercase text
    });

    var content = verseElement.text().trim();

    var data = [links[0], content];

    res.send(data);
  } catch (error) {
    res.status(500).send("Error fetching verse(s)...");
  }
});

app.listen(1332, () => console.log("Proxy server launched on port 1332"));
