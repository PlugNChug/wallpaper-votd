const content = document.getElementById("content");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; 
  }

content.innerHTML = getRandomInt(1, 10);

// This is the "main loop," where we check to verify the verse of the day. To prevent overdoing API calls, this will only call itself once every 30 seconds.
function verifyVerse() {
    
}