// i18n core: loads language files once, fills [data-i18n] elements and
// notifies the other modules through a single "langchange" event.
const supportedLangs = ["en", "pl"];
const translationsCache = {};
window.currentLang = null;
window.translations = null;

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), obj);
}

async function loadTranslations(lang) {
  if (!translationsCache[lang]) {
    const res = await fetch(`languages/${lang}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translationsCache[lang] = await res.json();
  }
  return translationsCache[lang];
}

function setActiveLangButton(lang) {
  document.querySelectorAll(".lang-switcher-switch").forEach(el => {
    const active = el.dataset.lang === lang;
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", String(active));
  });
}

function applyTranslations(translations) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const value = getNestedValue(translations, el.getAttribute("data-i18n"));
    if (typeof value === "string") el.textContent = value;
  });
}

async function changeLang(lang) {
  if (!supportedLangs.includes(lang)) lang = "en";
  let translations;
  try {
    translations = await loadTranslations(lang);
  } catch (e) {
    console.error(`Could not load translation for '${lang}'`, e);
    return;
  }

  window.currentLang = lang;
  window.translations = translations;
  document.documentElement.lang = lang;
  applyTranslations(translations);
  setActiveLangButton(lang);
  try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }

  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang, translations } }));
}

function initialLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (supportedLangs.includes(saved)) return saved;
  } catch (e) { /* storage unavailable */ }
  return (navigator.language || "").toLowerCase().startsWith("pl") ? "pl" : "en";
}

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".lang-switcher-switch").forEach(btn => {
    btn.addEventListener("click", () => changeLang(btn.dataset.lang));
  });

  // Sections are fetched by load.js — translate only once they are in the DOM
  await window.sectionsReady;
  changeLang(initialLang());
});
