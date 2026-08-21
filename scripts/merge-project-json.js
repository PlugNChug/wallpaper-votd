const fs = require("fs");
const path = require("path");

/**
 * Invert { ui_key: { "en-us": "...", ... } } into WE localization shape
 * { "en-us": { ui_key: "..." }, ... }
 */
function buildLocalization(i18n) {
  const localization = {};
  for (const [key, byLocale] of Object.entries(i18n)) {
    for (const [locale, text] of Object.entries(byLocale)) {
      if (!localization[locale]) localization[locale] = {};
      localization[locale][key] = text;
    }
  }
  return localization;
}

function mergeProjectJson() {
  const projectPath = path.resolve(__dirname, "../src/project.json");
  const i18nPath = path.resolve(__dirname, "../src/i18n.json");
  const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
  const i18n = JSON.parse(fs.readFileSync(i18nPath, "utf8"));
  project.general.localization = buildLocalization(i18n);
  return JSON.stringify(project, null, "\t");
}

module.exports = { buildLocalization, mergeProjectJson };
