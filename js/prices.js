'use strict';

const catalog = window.priceCatalog;
const container = document.querySelector('#catalog');
const selector = document.querySelector('#car-category');
const categoryText = document.querySelector('#category-text');
const desktop = window.matchMedia('(min-width: 64rem)');
let lastCategory = '0';
let preferredCategory;

function element(tag, content = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
}

function details(label, body, className = '') {
  const disclosure = element('details', '', className);
  disclosure.append(element('summary', label), body);
  return disclosure;
}

function note(key) {
  return element('p', catalog.notes[key], 'price-note');
}

function createTable(label, columns, className) {
  const table = element('table', '', className);
  table.append(element('caption', label, 'visually-hidden'));
  const head = table.createTHead().insertRow();
  for (const label of columns) {
    const th = element('th', label);
    th.scope = 'col';
    head.append(th);
  }
  return { table, body: table.createTBody() };
}

function serviceRow(body, item) {
  const row = body.insertRow();
  row.id = item.id;
  const label = element('th', '', 'service-name');
  label.scope = 'row';
  label.append(element('span', item.name));
  if (item.unit !== 'услуга') label.append(element('small', item.unit, 'unit'));
  const copy = [item.description, ...item.notes.map((key) => catalog.notes[key])].filter(Boolean);
  if (copy.length) {
    const paragraphs = element('div');
    paragraphs.append(...copy.map((value) => element('p', value)));
    label.append(details('Подробнее', paragraphs, 'service-details'));
  }
  row.append(label);
  for (const [index, value] of item.prices.entries()) {
    const cell = row.insertCell();
    cell.textContent = formatPrice(value, item.priceType);
    cell.dataset.i = index;
  }
}

function serviceTable(group, items, title) {
  const categories = group === 'moto' ? catalog.motoCategories : catalog.carCategories;
  const fixed = group === 'repair';
  const columns = fixed ? ['Услуга', 'Цена'] : ['Услуга', ...categories.map((_, i) => `Кат. ${i+1}`)];
  const classes = fixed ? 'repair-table' : group === 'moto' ? 'moto-table' : 'car-table';
  const { table, body } = createTable(title, columns, `price-table ${classes}`);
  if (!fixed) {
    const headers = [...table.tHead.rows[0].cells].slice(1);
    for (const [index, header] of headers.entries()) {
      header.dataset.i = index;
      header.title = categories[index];
      header.setAttribute('aria-label', `Категория ${index + 1}. ${categories[index]}`);
    }
  }
  for (const item of items) serviceRow(body, item);
  return table;
}

const tireColumns = [
  ['removeInstall', 'Съём / установка'], ['dismount', 'Демонтаж покрышки'],
  ['mount', 'Монтаж покрышки'], ['balance', 'Балансировка'],
  ['totalOne', 'Итого за 1 колесо'], ['totalFour', 'Итого за 4 колеса'],
];

function tireTable(source) {
  const base = source.vehicleType === 'passenger' ? 'Легковые автомобили' : 'Внедорожники, кроссоверы и микроавтобусы';
  const type = source.tireType === 'runflat' ? 'Runflat (усиленный борт)' : 'Обычные шины';
  const { table, body } = createTable(`${base}. ${type}`,
    ['Диаметр диска', ...tireColumns.map(([, title]) => title)], 'price-table tires-table');
  const mobile = element('div', '', 'tires-mobile');

  for (const wheel of source.rows) {
    const row = body.insertRow();
    const radius = `R${wheel.diameter}`;
    const heading = element('th', radius);
    heading.scope = 'row';
    row.append(heading);
    for (const [key] of tireColumns) row.insertCell().textContent = formatPrice(wheel[key]);

    const breakdown = element('dl', '', 'tire-breakdown');
    for (const [key, title] of tireColumns) breakdown.append(element('dt', title), element('dd', formatPrice(wheel[key])));
    const item = details(radius, breakdown, 'tire-wheel');
    item.querySelector('summary').append(element('strong', `${formatPrice(wheel.totalFour)} / 4 колеса`));
    mobile.append(item);
  }

  const title = `${base} · ${type}`;
  const box = element('div', '', 'tire-content');
  box.append(table, mobile);
  return details(title, box, 'tire-group');
}

function addGroup(group) {
  const section = element('section', '', 'price-section');
  section.id = group.id;
  section.append(element('h2', group.title));
  if (group.id === 'tires') {
    section.append(...group.tables.map(tireTable));
  } else if (group.id === 'repair') {
    const subsections = new Map();
    for (const item of group.items) {
      if (!subsections.has(item.subsection)) subsections.set(item.subsection, []);
      subsections.get(item.subsection).push(item);
    }
    for (const [title, items] of subsections) {
      section.append(element('h3', title), serviceTable(group.id, items, title));
    }
  } else {
    if (group.id !== 'moto') {
      const change = element('a', 'Изменить категорию', 'text-link change-category');
      change.href = '#category';
      section.append(change);
    } else {
      const list = element('ol', '', 'moto-categories');
      list.append(...catalog.motoCategories.map((name) => element('li', name)));
      section.append(details('Категории мототехники', list, 'moto-guide'));
    }
    section.append(serviceTable(group.id, group.items, group.title));
    if (group.notes) section.append(...group.notes.map(note));
  }
  container.append(section);
}

for (const group of catalog.groups) addGroup(group);

const guide = document.querySelector('#category-guide');
const all = new Option('Все категории', 'all');
selector.add(all);
for (const [index, name] of catalog.carCategories.entries()) {
  selector.add(new Option(`Категория ${index + 1}`, String(index)));
  guide.append(element('li', name));
}
document.querySelector('#category-note').textContent = catalog.notes.classes;
document.querySelector('.category-card').hidden = false;

function setCategory(value) {
  selector.value = value;
  const showAll = value === 'all';

  for (const cell of container.querySelectorAll('.car-table [data-i]')) {
    cell.hidden = !showAll && cell.dataset.i !== value;
  }
  categoryText.textContent = showAll
    ? 'Сравните цены по всем категориям.'
    : catalog.carCategories[Number(value)];
}

function adaptCategory() {
  all.hidden = !desktop.matches;
  all.disabled = !desktop.matches;
  const preferred = preferredCategory ?? (desktop.matches ? 'all' : lastCategory);
  setCategory(preferred === 'all' && !desktop.matches ? lastCategory : preferred);
}
selector.addEventListener('change', () => {
  preferredCategory = selector.value;
  if (preferredCategory !== 'all') lastCategory = preferredCategory;
  adaptCategory();
});
desktop.addEventListener('change', adaptCategory);
adaptCategory();

// The catalog is rendered after parsing, so initial fragment navigation needs a second pass.
function revealHash() {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  if (target?.matches('.price-section, tr')) target.scrollIntoView({ behavior: 'instant' });
}
if (location.hash) {
  revealHash();
  document.fonts.ready.then(revealHash);
}
