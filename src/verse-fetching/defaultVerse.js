function defaultVerse() {
  document.getElementById("load").classList.add("invisible");
  document.getElementById("verse").innerHTML =
    "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.";
  document.getElementById("source").innerHTML = "Proverbs 3:5-6";

  setTimeout(() => {
    document.getElementById("verse").classList.add("textfade");
    document.getElementById("source").classList.add("textfade");
    document.getElementById("verse").classList.remove("invisible");
    document.getElementById("source").classList.remove("invisible");
  }, 1250);
}

export default defaultVerse;