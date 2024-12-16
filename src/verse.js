const axios = require('axios');

async function grabVerse() {
  await axios.get('https://votd-grabber.onrender.com/scrape').then((res) => {
    // Obtain the link from the received data, then get the last portion of the link to obtain a preliminary string to parse further
    const link = res.data;
    const parseableString = link.split('/')[link.split('/').length - 1];
    console.log(link);

    // Get the first item in the further split parseableString to obtain the string for book and chapter
    const location = parseableString.split('.')[0];
    // Get the second item in the further split parseableString to obtain a verse number string
    const verse = parseableString.split('.')[1];

    console.log(location, verse);

    axios.get(`https://bible-api.com/${location}:${verse}?translation=web`).then((res) => {
      console.log(res.data.text);
      document.getElementById('verse').innerHTML = res.data.text;

      var book = "NULL";
      var chapter = "NULL";
      var strIndex = 1;
      while (!isNaN(location.substring(location.length - 1 - strIndex))) {
        strIndex++;
      }
      console.log(strIndex);
      book = location.substring(0, location.length - strIndex);
      chapter = location.substring(location.length - strIndex);

      document.getElementById('source').innerHTML = `${book} ${chapter}:${verse}`;
    })
  })
}

export default grabVerse;
