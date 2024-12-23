import bollsFetch from "./verse-fetching/bollsFetch";
import helloaoFetch from "./verse-fetching/helloaoFetch";

export async function grabVerse(translation, translation2) {
  if (["eng_asv", "BSB", "fra_sbl", "GREEK"].includes(translation)) {
    helloaoFetch(translation, translation2);
  } else {
    bollsFetch(translation);
  }
}

export async function grabVerseAgain(translation) {
  if (["eng_asv", "BSB", "fra_sbl"].includes(translation)) {
    helloaoFetch(translation);
  } else {
    bollsFetch(translation);
  }
}
