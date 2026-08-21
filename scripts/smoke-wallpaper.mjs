/**
 * Headless smoke test for the wallpaper against webpack-dev-server.
 * Simulates sleep by freezing the page clock gap + clearing BG layers.
 * Run: node scripts/smoke-wallpaper.mjs
 */
import puppeteer from "puppeteer";

const BASE = process.env.WALLPAPER_URL || "http://127.0.0.1:1331";

async function waitForVerse(page, timeout = 90000) {
  await page.waitForFunction(
    () => {
      const load = document.getElementById("load");
      const verse = document.getElementById("verse");
      const loadHidden = load && load.classList.contains("invisible");
      const verseVisible =
        verse &&
        !verse.classList.contains("invisible") &&
        (verse.textContent || "").trim().length > 0;
      return loadHidden && verseVisible;
    },
    { timeout },
  );
}

async function bgState(page) {
  return page.evaluate(() => {
    const curr = document.getElementById("background2");
    const overlay = document.getElementById("background3");
    const child = curr?.firstElementChild;
    return {
      currInvisible: curr?.classList.contains("invisible") ?? null,
      overlayInvisible: overlay?.classList.contains("invisible") ?? null,
      currHasChild: !!child,
      currChildTag: child?.tagName || null,
      currSrc:
        child?.tagName === "OBJECT"
          ? child.data
          : child?.src || child?.currentSrc || null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      verse: document.getElementById("verse")?.textContent?.slice(0, 80) || "",
      loadVisible: !document
        .getElementById("load")
        ?.classList.contains("invisible"),
    };
  });
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  console.log("Loading", BASE);
  await page.goto(BASE, { waitUntil: "networkidle2" });

  console.log("Waiting for verse…");
  await waitForVerse(page);
  const afterLoad = await bgState(page);
  console.log("After load:", JSON.stringify(afterLoad, null, 2));

  if (afterLoad.currInvisible && afterLoad.overlayInvisible) {
    throw new Error("Both BG layers invisible after load (white screen)");
  }
  if (!afterLoad.currHasChild && afterLoad.overlayInvisible) {
    throw new Error("No background child and overlay hidden (white screen)");
  }

  // Simulate sleep damage: empty BG containers (broken SVG after sleep)
  console.log("Simulating sleep damage (clear BG DOM)…");
  await page.evaluate(() => {
    document.getElementById("background1").innerHTML = "";
    document.getElementById("background2").innerHTML = "";
    document.getElementById("background2").classList.add("invisible");
    document.getElementById("background3").classList.add("invisible");
  });

  const damaged = await bgState(page);
  console.log("Damaged:", JSON.stringify(damaged, null, 2));

  // Simulate tick gap recovery: rewind lastTickAt via exposed path by waiting
  // and calling focus / or directly invoking recovery by faking time.
  // Our recovery triggers when now - lastTickAt > 5000. Patch lastTickAt
  // by evaluating a synthetic long delay between ticks:
  await page.evaluate(() => {
    // Force the next interval callback to see a large gap by monkey-patching Date.now
    const realNow = Date.now.bind(Date);
    let skew = 0;
    Date.now = () => realNow() + skew;
    skew = 10000; // next tick thinks 10s passed
    window.__restoreDate = () => {
      Date.now = realNow;
    };
  });

  // Wait for at least one interval tick (1s) + recovery
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => window.__restoreDate?.());

  // Also fire visibility/focus as Wallpaper Engine sometimes does on resume
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });

  await new Promise((r) => setTimeout(r, 2500));

  const recovered = await bgState(page);
  console.log("Recovered:", JSON.stringify(recovered, null, 2));

  if (!recovered.currHasChild && recovered.overlayInvisible) {
    throw new Error("Recovery failed: still no background after wake sim");
  }
  if (recovered.currInvisible && recovered.overlayInvisible) {
    throw new Error("Recovery failed: both layers still invisible");
  }

  // Russian SYNOD path
  console.log("Switching to SYNOD via wallpaperPropertyListener…");
  await page.evaluate(() => {
    window.wallpaperPropertyListener.applyUserProperties({
      bibleversion: { value: "SYNOD" },
    });
  });

  await page.waitForFunction(
    () => {
      const verse = document.getElementById("verse")?.textContent || "";
      return /[\u0400-\u04FF]/.test(verse);
    },
    { timeout: 120000 },
  );
  const synod = await page.evaluate(() => ({
    verse: document.getElementById("verse")?.textContent || "",
    source: document.getElementById("source")?.textContent || "",
    loadVisible: !document
      .getElementById("load")
      ?.classList.contains("invisible"),
  }));
  console.log("SYNOD result:", JSON.stringify(synod, null, 2));

  if (!synod.verse.trim()) {
    throw new Error("SYNOD produced empty verse");
  }
  console.log("SYNOD Cyrillic OK");

  if (errors.length) {
    console.log("Page errors:", errors);
  }

  console.log("SMOKE PASS");
  await browser.close();
}

main().catch(async (e) => {
  console.error("SMOKE FAIL:", e);
  process.exit(1);
});
