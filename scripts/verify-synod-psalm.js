/**
 * Verify SYNOD Psalm 42:8 resolves via LXX mapping (Heb 42 → LXX 41, verse+1).
 * Run: node scripts/verify-synod-psalm.js
 */
async function main() {
  // Expected: Hebrew 42:8 → try LXX ch 41 v8, then v9 (superscription)
  const candidates = [
    { chapter: 41, verse: 8 },
    { chapter: 41, verse: 9 },
    { chapter: 42, verse: 8 },
  ];

  let resolved = null;
  for (const c of candidates) {
    const res = await fetch(
      `https://bolls.life/get-text/SYNOD/19/${c.chapter}/`,
    );
    if (!res.ok) continue;
    const chapter = await res.json();
    const row = chapter.find((v) => v.verse === c.verse);
    if (row?.text) {
      resolved = { ...c, text: row.text };
      break;
    }
  }

  if (!resolved) {
    console.error("FAIL: could not resolve SYNOD Psalm 42:8");
    process.exit(1);
  }

  console.log("OK via SYNOD Ps" + resolved.chapter + ":" + resolved.verse);
  console.log(resolved.text);

  // Sanity: Protestant KJV still has 42:8 directly
  const kjv = await (
    await fetch("https://bolls.life/get-text/KJV/19/42/")
  ).json();
  if (!kjv.find((v) => v.verse === 8)) {
    console.error("FAIL: KJV missing 42:8 unexpectedly");
    process.exit(1);
  }
  console.log("KJV Ps42:8 still present (control OK)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
