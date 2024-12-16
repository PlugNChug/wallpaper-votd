const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const cheerio = require("cheerio");

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
    res.send(links[0]);
  } catch (error) {
    res.status(500).send("Error fetching verse(s)...");
  }
});

app.listen(1332, () => console.log("Proxy server launched on port 1332"));
