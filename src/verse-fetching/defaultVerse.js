import { displayVerse, loadVerseCache } from "./fetchUtils";

function defaultVerse(gen, preferredTranslation) {
  const cache = loadVerseCache();
  if (
    cache?.text &&
    cache?.source &&
    (!preferredTranslation || cache.translation === preferredTranslation)
  ) {
    displayVerse(cache.text, cache.source, {
      fade: false,
      cache: false,
      gen,
      translation: cache.translation,
    });
    return;
  }

  displayVerse(
    "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
    "Proverbs 3:5-6",
    { fade: true, cache: false, gen },
  );
}

export default defaultVerse;
