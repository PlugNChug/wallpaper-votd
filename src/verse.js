const axios = require('axios');

function grabVerse() {
  const config = {
    headers: {
      Accept: "application/json",
    },
  };

  var out;
  axios.get('https://icanhazdadjoke.com/', config).then((res) => {
    console.log(res.data);
    document.getElementById('verse').innerHTML = res.data.joke;
  })

  console.log(out);
}

export default grabVerse;
