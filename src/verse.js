import settings from "./project.json";
import bollsFetch from "./verse-fetching/bollsFetch";
import helloaoFetch from "./verse-fetching/helloaoFetch";

export async function grabVerse() {
  const translation = settings.general.properties.bibleversion.value;
  const translation2 = settings.general.properties.bibleversion2.value;
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
