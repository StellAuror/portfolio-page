const supportedLangs = ["en", "pl"];
window.currentLang = "en";
window.lang = "en";

function setActiveLangButton(lang) {
  document.querySelectorAll(".lang-switcher-switch").forEach(el => {
    el.style.backgroundColor = "";
    el.style.color = "";
  });
  const activeBtn = document.querySelector(`.lang-switcher-switch[data-lang="${lang}"]`);
  if (activeBtn) {
    activeBtn.style.backgroundColor = "#fff";
    activeBtn.style.color = "#000";
  }
}

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (let key of keys) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }
  return current;
}

async function changeLang(lang) {
  try {
    const res = await fetch(`languages/${lang}.json`);
    const translations = await res.json();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = getNestedValue(translations, key) || key;
  });

    setActiveLangButton(lang);
    window.currentLang = lang;
  } catch (e) {
    console.error(`Could not load translation for '${lang}'`, e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const defaultLang = "en";

  document.querySelectorAll(".lang-switcher-switch").forEach(btn => {
    btn.addEventListener("click", () => {
      lang = btn.getAttribute("data-lang");
      changeLang(lang);
    });
  });

  changeLang(defaultLang);
});
