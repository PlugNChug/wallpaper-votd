/**
 * This function takes a string and returns the index of the first number found in it.
 * If no number is found, it returns the length of the string.
 * @param {string} str - The input string to search for a number.
 * @return {number} - The index of the first number found or the length of the string.
 */
function findFirstNumberPos(str) {
  for (let i = 1; i < str.length; i++) {
    if (!isNaN(str.charAt(i))) {
      return i;
    }
  }
  // Default to string length if no number is found
  return str.length;
}

function dataParser(data) {
  // At this point, data is a link. Here, we will parse the link to get the book, chapter, and verse.
  // The link is formatted like this:
  // https://biblia.com/bible/niv/[LOCATION]
  const parseableString = data.split("/")[data.split("/").length - 1];

  // Get the first item in the further split parseableString to obtain the string for book and chapter
  // This is assuming that the string is formatted like "BookChapter.Verse"
  // There are exceptions though, see further down...
  const locationString = parseableString.split(".")[0];

  // Variable declarations
  var book = "NULL";
  var chapterString = "NULL";
  var strIndex = 1;

  // Set strIndex.
  while (
    !isNaN(locationString.substring(locationString.length - 1 - strIndex))
  ) {
    strIndex++;
  }

  // Get the book and chapter from the locationString.
  // The book is the string before the first number, and the chapter is the string after.
  book = locationString.substring(0, locationString.length - strIndex);
  chapterString = locationString.substring(locationString.length - strIndex);

  // Get the second item in the further split parseableString to obtain a verse number range.
  // This range can either be a single verse or an actual range of verses.
  // String representations of numbers will be converted to actual numbers.
  var verseString = parseableString.split(".")[1];

  // However, exceptions can arise; some books only have one chapter (e.g. Obadiah, Jude, etc.)
  // The fetched link doesn't include the chapter number for these books.
  // Checking if the verseString is undefined will account for these cases.
  var verseRange = [];
  if (verseString === undefined) {
    var numPos = findFirstNumberPos(locationString);
    verseRange = locationString.substring(numPos).split("-").map(Number);

    // Fix the book, chapter, and verse strings
    book = locationString.substring(0, numPos);
    chapterString = "1";
    verseString = locationString.substring(numPos);
  } else {
    verseRange = verseString.split("-").map(Number);
  }

  // Debug console logging (uncomment to see)
    // console.log("Book: ", book);
    // console.log("Chapter: ", chapterString);
    // console.log("Verse: ", verseString);
    // console.log("Verse range: ", verseRange);

  return [book, chapterString, verseRange, verseString];
}

export default dataParser;
