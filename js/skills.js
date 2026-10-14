// Stack: the platforms I build on and the tools I use within each (i18n via language.js "langchange")
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function platformBlock(platform) {
  const block = el('article', 'stack-platform');

  const label = el('header', 'stack-label');
  label.appendChild(el('h3', 'stack-name', platform.name));
  label.appendChild(el('p', 'stack-tagline', platform.tagline));
  block.appendChild(label);

  const list = el('ul', 'stack-tools');
  (platform.tools || []).forEach((tool) => {
    const item = el('li', 'stack-tool');
    item.appendChild(el('span', 'stack-tool-name', tool.name));
    item.appendChild(el('span', 'stack-tool-note', tool.note || ''));
    list.appendChild(item);
  });
  block.appendChild(list);
  return block;
}

function listColumn(name, items) {
  const column = el('div', 'stack-column');
  column.appendChild(el('h4', 'stack-column-name', name));
  const list = el('ul', 'stack-column-list');
  (items || []).forEach((item) => list.appendChild(el('li', null, item)));
  column.appendChild(list);
  return column;
}

function renderStack(skills) {
  const section = document.getElementById('skills');
  if (!section || !skills?.platforms) return;

  section.querySelector('.section-header').textContent = skills.title || '';
  section.querySelector('.section-subtitle').textContent = skills.subtitle || '';

  document.getElementById('stack-platforms').replaceChildren(...skills.platforms.map(platformBlock));

  document.getElementById('stack-more-title').textContent = skills.moreTitle || '';
  document.getElementById('stack-more').replaceChildren(
    ...(skills.more || []).map((g) => listColumn(g.name, g.tools))
  );

  const comp = skills.competencies || {};
  document.getElementById('stack-competencies-title').textContent = comp.title || '';
  document.getElementById('stack-competencies').replaceChildren(
    ...(comp.groups || []).map((g) => listColumn(g.name, g.items))
  );
}

document.addEventListener('langchange', (e) => renderStack(e.detail.translations.skills));
