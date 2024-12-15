const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors()); // Enable CORS for all routes

app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get("https://www.verseoftheday.com/");
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching the requested URL.');
  }
});

app.listen(1332, () => console.log('Proxy server launched on port 1332'));