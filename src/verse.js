const axios = require('axios');

function grabVerse() {
  axios.get('https://votd-grabber.onrender.com/scrape').then((res) => {
    // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
    const link = res.data;
    const parseableString = link.split('/')[link.split('/').length - 1];

    // Get the first item in the further split parseableString to obtain the string for book and chapter
    const chapter = parseableString.split('.')[0];
    // Get the second item in the further split parseableString to obtain a verse number string
    const verse = parseableString.split('.')[1];

    axios.get(`https://bible-api.com/${chapter}:${verse}?translation=web`).then((res) => {
      console.log(res.data.text);
    })

    document.getElementById('verse').innerHTML = res.data.text;
  })
}

export default grabVerse;
