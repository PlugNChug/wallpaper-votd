# Bible Verse of the Day (Wallpaper Engine)

A web wallpaper for [Wallpaper Engine](https://www.wallpaperengine.io/) that shows the daily Bible verse from [verseoftheday.com](https://www.verseoftheday.com/), with multiple translation options, daily/night backgrounds, and customization settings.

Workshop: [Bible Verse of the Day](https://steamcommunity.com/sharedfiles/filedetails/?id=3393666431)

## Features

- Verse of the day via a scrape proxy, then text from [Bolls](https://bolls.life/) or [helloao](https://bible.helloao.org/) depending on the selected translation
- Many English translations plus Spanish, French, German, Portuguese, Chinese, Russian, Korean, Japanese, Dutch, Polish, Italian, Indonesian, and Greek options
- Localization for the above languages
- High customizability

## Requirements

- [Node.js](https://nodejs.org/) 18+ (for building)
- Wallpaper Engine (Windows)

## Setup

```bash
npm install
npm run build
```

Point Wallpaper Engine at the `dist/` folder (or copy `dist/` into your Workshop project directory). The built package includes `index.html`, the JS bundle, assets, and `project.json`.

### Development

```bash
npm run dev
```

Opens a local preview at `http://localhost:1331`. Wallpaper Engine property injection is simulated only when you call `window.wallpaperPropertyListener.applyUserProperties(...)` from the browser console.

## Project structure

| Path | Purpose |
|------|---------|
| `src/index.js` | Clock, backgrounds, wake recovery, property listener |
| `src/verse.js` / `src/verse-fetching/` | Verse fetch, cache, Psalm LXX mapping |
| `src/backgroundHelper.js` | Background media helpers |
| `src/project.json` | Wallpaper Engine metadata and user properties |
| `src/i18n.json` | Property label translations (merged into `project.json` on build) |
| `src/styles/main.scss` | Layout and animations |
| `backend/` | Optional local scrape proxy (production uses a hosted Render URL) |
| `dist/` | Build output loaded by Wallpaper Engine |

## User properties (overview)

- **Bible Version** / **Secondary** (for Greek NT OT fallback)
- **24 Hour Time**, **Month Language**, **Date/Time Position**
- **Background**, custom image/video, **Static Background**
- **Verse Box** (ripple / no ripple / no box)

Property labels follow Wallpaper Engine’s `ui_*` localization tokens. Change the app UI language under Wallpaper Engine → General to see translated settings.

## Notes

- First verse load can take a while if the scrape proxy is waking from idle.
- An internet connection is required for the live verse; offline use falls back to a cached or default verse.

## License

ISC
