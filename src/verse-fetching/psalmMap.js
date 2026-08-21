/**
 * Translations on Bolls that use Septuagint (LXX) Psalm chapter numbering
 * (common for Russian Synodal and related editions).
 */
export const LXX_PSALM_TRANSLATIONS = new Set([
  "SYNOD",
  "NRT",
  "RBS2",
  "BTI",
  "JNT",
  "TNHR",
  "DESN",
  "LXX",
]);

/**
 * Map a Protestant/Hebrew Psalm reference to LXX chapter + verse range.
 * Synodal editions also often count the superscription as verse 1, so callers
 * should try verse+1 if the mapped verse is missing.
 *
 * @returns {{ chapter: number, verseStart: number, verseEnd: number }}
 */
export function mapHebrewPsalmToLxx(chapter, verseStart, verseEnd) {
  const hebCh = Number(chapter);
  let lxxCh = hebCh;
  let start = verseStart;
  let end = verseEnd;

  if (hebCh >= 1 && hebCh <= 8) {
    lxxCh = hebCh;
  } else if (hebCh === 9) {
    lxxCh = 9;
  } else if (hebCh === 10) {
    // Hebrew 10 → LXX 9:21–38
    lxxCh = 9;
    start = verseStart + 20;
    end = verseEnd + 20;
  } else if (hebCh >= 11 && hebCh <= 113) {
    lxxCh = hebCh - 1;
  } else if (hebCh === 114) {
    lxxCh = 113;
  } else if (hebCh === 115) {
    // Hebrew 115 → LXX 113:9–18
    lxxCh = 113;
    start = verseStart + 8;
    end = verseEnd + 8;
  } else if (hebCh === 116) {
    if (verseEnd <= 9) {
      lxxCh = 114;
    } else if (verseStart >= 10) {
      lxxCh = 115;
      start = verseStart - 9;
      end = verseEnd - 9;
    } else {
      // Range spans both LXX 114 and 115 — keep start chapter; caller may miss end
      lxxCh = 114;
    }
  } else if (hebCh >= 117 && hebCh <= 146) {
    lxxCh = hebCh - 1;
  } else if (hebCh === 147) {
    if (verseEnd <= 11) {
      lxxCh = 146;
    } else if (verseStart >= 12) {
      lxxCh = 147;
      start = verseStart - 11;
      end = verseEnd - 11;
    } else {
      lxxCh = 146;
    }
  } else {
    // 148–150 (and any oddities): same numbering
    lxxCh = hebCh;
  }

  return { chapter: lxxCh, verseStart: start, verseEnd: end };
}

/**
 * Pull verse text from a Bolls chapter array. Throws if any verse is missing.
 */
export function extractBollsVerseText(chapter, verseRange) {
  const parts = [];
  for (let i = verseRange[0]; i <= verseRange[verseRange.length === 1 ? 0 : 1]; i++) {
    const row = chapter.find((item) => item.verse === i);
    if (!row || row.text == null) {
      throw new Error(`Verse ${i} not found in chapter`);
    }
    parts.push(row.text);
  }
  return parts.join(" ").trimEnd();
}

/**
 * Resolve chapter URL pieces for Bolls, applying LXX Psalm mapping when needed.
 * Returns candidates to try in order: [{ chapterString, verseRange }, ...]
 */
export function bollsPsalmCandidates(translation, book, chapterString, verseRange) {
  const isPsalm = book === "Psalms" || book === "Psalm";
  const start = verseRange[0];
  const end = verseRange.length > 1 ? verseRange[1] : verseRange[0];

  if (!isPsalm || !LXX_PSALM_TRANSLATIONS.has(translation)) {
    return [{ chapterString, verseRange: verseRange.length > 1 ? [start, end] : [start] }];
  }

  const mapped = mapHebrewPsalmToLxx(chapterString, start, end);
  const primaryRange =
    mapped.verseStart === mapped.verseEnd
      ? [mapped.verseStart]
      : [mapped.verseStart, mapped.verseEnd];
  // Synodal (and similar) count the superscription as verse 1, so Hebrew N
  // is usually LXX N+1. Prefer the shifted reading first to avoid matching
  // the previous verse's text.
  const shiftedRange =
    mapped.verseStart === mapped.verseEnd
      ? [mapped.verseStart + 1]
      : [mapped.verseStart + 1, mapped.verseEnd + 1];

  return [
    { chapterString: String(mapped.chapter), verseRange: shiftedRange },
    { chapterString: String(mapped.chapter), verseRange: primaryRange },
    // Last resort: original Protestant reference (some editions match)
    { chapterString, verseRange: verseRange.length > 1 ? [start, end] : [start] },
  ];
}
