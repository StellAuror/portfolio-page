// Compact Skills Module (i18n-first)

// State
const SkillsState = {
  lang: 'en',
  data: null,       // full language JSON (current lang)
  skills: null,     // data.skills of current lang
  cache: {},        // lang => JSON
  initialized: false,
};

// Utilities
const byPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);

function t(key, params = {}, fallback = key) {
  const str = byPath(SkillsState.data?.skillUI || {}, key);
  let out = typeof str === 'string' ? str : fallback;
  if (out && typeof out === 'string' && params) {
    out = out.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m));
  }
  return out;
}

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
};

// Data
async function loadLangJSON(lang) {
  if (SkillsState.cache[lang]) return SkillsState.cache[lang];
  const res = await fetch(`languages/${lang}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  SkillsState.cache[lang] = json;
  return json;
}

const validSkills = (json) => Array.isArray(json?.skills?.categories);

async function getSkillsData(lang = 'en') {
  const tries = lang === 'en' ? ['en'] : [lang, 'en'];
  for (const l of tries) {
    try {
      const json = await loadLangJSON(l);
      if (validSkills(json)) {
        SkillsState.data = json;
        SkillsState.skills = json.skills;
        SkillsState.lang = l;
        return json.skills;
      }
    } catch (e) {
      // swallow and try next
    }
  }
  throw new Error('skills.loadFailed');
}

// Error UI
function showSkillsError(key, params = {}, fallback = 'Error') {
  const section = document.getElementById('skills');
  if (!section) return;
  section.querySelector('.skills-error')?.remove();

  const msg = t(key, params, fallback);
  const box = el('div', 'skills-error', msg);
  box.style.cssText =
    'background:#fee;border:1px solid #fcc;border-radius:4px;color:#c33;padding:1rem;margin:1rem 0;text-align:center;';
  section.appendChild(box);
}

// Charts + Analytics
const slugify = (s) =>
  (s || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || 'uncategorized';

function analyze(skillsData) {
  const categories = skillsData?.categories || [];
  const allSkills = [];
  const categoryStats = {};

  for (const c of categories) {
    const key = slugify(c.name);
    const list = Array.isArray(c.skills) ? c.skills : [];
    categoryStats[key] = { name: c.name || '', count: list.length, skills: list };
    for (const s of list) {
      const name = typeof s === 'object' ? (s.name || s.skill || '') : s;
      const mastery = typeof s === 'object' ? Number(s.mastery ?? s.level ?? 3) : 1;
      allSkills.push({ name, mastery, category: key });
    }
  }
  return { allSkills, categoryStats };
}

function generateMasteryChart(skills) {
  const elRoot = document.getElementById('mastery-chart');
  if (!elRoot) return;
  elRoot.innerHTML = '';

  const levels = [5, 4, 3, 2, 1];
  const counts = levels.map((l) => skills.filter((s) => s.mastery === l).length);
  const max = Math.max(1, ...counts);

  levels.forEach((level, idx) => {
    const row = el('div', 'mastery-level-bar');
    const label = el('div', 'level-label', t('analytics.masteryLevel', { level }, `Level ${level}`));
    const bar = el('div', 'level-bar');
    const fill = el('div', `level-fill level-${level}`);
    const count = el('div', 'level-count', String(counts[idx]));

    fill.style.width = `${(counts[idx] / max) * 100}%`;
    bar.appendChild(fill);
    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(count);
    elRoot.appendChild(row);
  });
}

function generateCategoryChart(categoryStats) {
  const elRoot = document.getElementById('category-chart');
  if (!elRoot) return;
  elRoot.innerHTML = '';

  const keys = Object.keys(categoryStats);
  const total = keys.reduce((sum, k) => sum + categoryStats[k].count, 0) || 1;

  keys.forEach((k) => {
    const cat = categoryStats[k];
    const percent = (cat.count / total) * 100;

    const row = el('div', 'category-bar');
    const name = el('div', 'category-name', cat.name);
    const cont = el('div', 'category-bar-fill');
    const fill = el('div', 'category-fill');
    const count = el(
      'div',
      'category-count',
      t('analytics.categoryCount', { count: cat.count, percentage: Math.round(percent) }, `${cat.count} (${Math.round(percent)}%)`)
    );

    fill.style.background = '#ffffff';
    fill.style.width = `${percent}%`;
    cont.appendChild(fill);
    row.appendChild(name);
    row.appendChild(cont);
    row.appendChild(count);
    elRoot.appendChild(row);
  });
}

function generateOverallStats(skills, categoryStats) {
  const overall = document.getElementById('overall-stats');
  const headerStats = document.getElementById('analytics-stats');
  if (!overall) return;

  const totalSkills = skills.length;
  const totalCategories = Object.keys(categoryStats).length;
  const averageMastery = totalSkills
    ? (skills.reduce((sum, s) => sum + (s.mastery || 0), 0) / totalSkills)
    : 0;
  const expertSkills = skills.filter((s) => s.mastery >= 4).length;

  if (headerStats) {
    headerStats.textContent = t(
      'analytics.summary',
      { totalSkills, totalCategories },
      `${totalSkills} skills across ${totalCategories} categories`
    );
  }

  const stats = [
    { value: String(totalSkills), label: t('analytics.totalSkills', {}, 'Total Skills') },
    { value: String(totalCategories), label: t('analytics.categories', {}, 'Categories') },
    { value: averageMastery.toFixed(1), label: t('analytics.avgMastery', {}, 'Avg Mastery') },
    { value: String(expertSkills), label: t('analytics.expertLevel', {}, 'Expert Level') },
  ];

  overall.innerHTML = '';
  stats.forEach((s) => {
    const item = el('div', 'stat-item');
    const v = el('div', 'stat-value', s.value);
    const l = el('div', 'stat-label', s.label);
    item.appendChild(v);
    item.appendChild(l);
    overall.appendChild(item);
  });
}

// Popup
async function fetchSkillDescription(skillName) {
  const key = skillName?.toLowerCase?.() || '';
  const local = SkillsState.data?.skillDescriptions?.[key];
  if (local) return local;

  // Try English fallback if current lang is not English
  if (SkillsState.lang !== 'en') {
    try {
      const en = await loadLangJSON('en');
      const desc = en?.skillDescriptions?.[key];
      if (desc) return desc;
    } catch {
      // ignore
    }
  }

  return t(
    'popup.noDescription',
    { skillName },
    `Detailed information about ${skillName} is not available in the current language.`
  );
}

function hideSkillPopup() {
  const overlay = document.getElementById('skill-popup-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 200);
}

async function showSkillPopup(skillName, masteryLevel) {
  let overlay = document.getElementById('skill-popup-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'skill-popup-overlay';
    overlay.className = 'skill-popup-overlay';
    overlay.addEventListener('click', (e) => e.target === overlay && hideSkillPopup());
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="skill-popup" role="dialog" aria-modal="true">
      <button class="skill-popup-close" title="${t('popup.close', {}, 'Close')}" aria-label="${t('popup.close', {}, 'Close')}" onclick="hideSkillPopup()">×</button>
      <h3 class="skill-popup-title">${skillName}</h3>
      <div class="skill-popup-mastery">
        <div class="popup-mastery-bar">
          ${Array.from({ length: 5 }, (_, i) => `<div class="popup-mastery-dot ${i < masteryLevel ? 'filled' : ''}"></div>`).join('')}
        </div>
        <span class="popup-mastery-level">${t('common.outOf', { x: masteryLevel, y: 5 }, `${masteryLevel}/5`)}</span>
      </div>
      <div class="skill-popup-description">
        <div class="skill-popup-loading">${t('popup.loading', {}, 'Loading...')}</div>
      </div>
    </div>
  `;
  overlay.classList.add('visible');

  const desc = await fetchSkillDescription(skillName);
  const elDesc = overlay.querySelector('.skill-popup-description');
  if (elDesc) elDesc.innerHTML = desc;
}

window.showSkillPopup = showSkillPopup;
window.hideSkillPopup = hideSkillPopup;

// Cards
function createSkillCard(category, index = 0, totalCategories = 0) {
  const card = el('div', 'skills-card');
  const header = el('div', 'skills-card-header');

  const title = el('h3', 'skills-card-title', category?.name || '');
  const count = Array.isArray(category?.skills) ? category.skills.length : 0;
  const countEl = el(
    'div',
    'skills-counter',
    t('card.itemsCount', { count: String(count).padStart(2, '0') }, `${String(count).padStart(2, '0')} items`)
  );
  const metrics = el(
    'div',
    'skill-metrics',
    t('card.metrics', { current: index + 1, total: totalCategories }, `${index + 1}/${totalCategories || '?'}`)
  );

  header.appendChild(title);
  header.appendChild(countEl);
  header.appendChild(metrics);

  const grid = el('div', 'skills-grid');
  const list = Array.isArray(category?.skills) ? category.skills : [];
  list.forEach((skill) => {
    const skillName = typeof skill === 'object' ? (skill.name || skill.skill || '') : skill;
    const masteryLevel = typeof skill === 'object' ? Number(skill.mastery ?? skill.level ?? 3) : 1;

    const item = el('div', 'skill-item');
    item.dataset.mastery = masteryLevel;

    const content = el('div', 'skill-content');
    const indicator = el('div', 'skill-indicator');
    const nameEl = el('div', 'skill-name', skillName);

    content.appendChild(indicator);
    content.appendChild(nameEl);

    const masteryContainer = el('div', 'skill-mastery');
    const bar = el('div', 'mastery-bar');
    for (let i = 1; i <= 5; i++) {
      const dot = el('div', 'mastery-dot');
      if (i <= masteryLevel) dot.classList.add('filled');
      bar.appendChild(dot);
    }
    const levelEl = el('div', 'mastery-level', t('common.outOf', { x: masteryLevel, y: 5 }, `${masteryLevel}/5`));

    masteryContainer.appendChild(bar);
    masteryContainer.appendChild(levelEl);

    item.appendChild(content);
    item.appendChild(masteryContainer);

    item.style.cursor = 'pointer';
    item.addEventListener('click', () => showSkillPopup(skillName, masteryLevel));

    grid.appendChild(item);
  });

  card.appendChild(header);
  card.appendChild(grid);
  return card;
}

// Rendering
function renderSkills(skillsData) {
  const section = document.getElementById('skills');
  if (!section) {
    showSkillsError('errors.sectionNotFound', {}, 'Skills section not found');
    return false;
  }

  section.querySelector('.skills-error')?.remove();

  const header = section.querySelector('.section-header');
  const subtitle = section.querySelector('.section-subtitle');
  if (header) header.textContent = skillsData?.title || '';
  if (subtitle) subtitle.textContent = skillsData?.subtitle || '';

  // Build cards
  section.querySelectorAll('.skills-card').forEach((el) => el.remove());
  const cats = skillsData?.categories || [];
  cats.forEach((c, i) => section.appendChild(createSkillCard(c, i, cats.length)));

  // Analytics
  const { allSkills, categoryStats } = analyze(skillsData);
  generateMasteryChart(allSkills);
  generateCategoryChart(categoryStats);
  generateOverallStats(allSkills, categoryStats);

  SkillsState.initialized = true;
  return true;
}

// Language switching
async function setSkillsLanguage(newLang) {
  if (!newLang || (SkillsState.initialized && newLang === SkillsState.lang)) return true;
  try {
    const data = await getSkillsData(newLang);
    return renderSkills(data);
  } catch (e) {
    showSkillsError(
      'errors.loadFailed',
      { language: newLang, error: e.message || String(e) },
      `Failed to load skills in ${newLang}.`
    );
    return false;
  }
}

// Init
async function initSkills() {
  const section = document.getElementById('skills');
  if (!section || SkillsState.initialized) return;

  const lang = window.currentLang || 'en';
  try {
    const data = await getSkillsData(lang);
    renderSkills(data);
  } catch (e) {
    showSkillsError(
      'errors.loadFailed',
      { language: lang, error: e.message || String(e) },
      `Failed to load skills in ${lang}.`
    );
  }
}

document.addEventListener('DOMContentLoaded', initSkills);

// Interop with external language switcher (optional)
if (typeof window.changeLang === 'function') {
  const prev = window.changeLang;
  window.changeLang = async (l) => {
    await prev(l);
    await setSkillsLanguage(l);
  };
}

// Expose
window.setSkillsLanguage = setSkillsLanguage;
window.loadSkillsSection = () => renderSkills(SkillsState.skills || {});