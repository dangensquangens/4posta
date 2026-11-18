'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/prices.js'), 'utf8'), context);
const catalog = JSON.parse(JSON.stringify(context.window.priceCatalog));
const services = catalog.groups.flatMap(({ items }) => items);
const items = new Map(services.map((item) => [item.id, item]));
const tires = catalog.groups.find(({ id }) => id === 'tires').tables;
assert.equal(services.length, 72);
assert.equal(items.size, services.length, 'У идентификаторов услуг не должно быть повторов');
assert.deepEqual(catalog.groups.map(({ items }) => items.length), [7, 26, 7, 9, 5, 8, 0, 10]);
assert.deepEqual(tires.map(({ rows }) => rows.length), [11, 8, 10, 8]);

const expected = {
  technical: [500, 550, 650, 650, 700],
  'euro-standard': [1600, 1800, 2000, 2150, 2300],
  'euro-complex': [2550, 2700, 2900, 3100, 3300],
  'four-posts': [6500, 6900, 7400, 7700, 8000],
  'interior-full': [17500, 18500, 20000, 22000, 24000],
};
for (const [id, values] of Object.entries(expected)) assert.deepEqual(items.get(id).prices, values, id);
assert.equal(items.get('interior-full').priceType, 'from');
assert.deepEqual(items.get('textile-mat').prices, [450, 450, 450, 450, 450]);
assert.equal(items.get('textile-mat').priceType, 'fixed');
assert.equal(items.get('textile-mat').unit, '1 шт.');

const passenger = tires.find(({ id }) => id === 'passenger-standard').rows;
assert.equal(passenger.find(({ diameter }) => diameter === 16).totalFour, 4400);
assert.equal(passenger.find(({ diameter }) => diameter === 20).totalFour, 7200);

function assertPrices(prices) {
  assert(prices.every((value) => Number.isInteger(value) && value > 0), 'Цены должны быть целыми рублями');
}

for (const group of catalog.groups) {
  for (const key of group.notes || []) assert(catalog.notes[key]);
  for (const item of group.items) {
    assert.equal(item.group, group.id);
    assert.equal(item.prices.length, group.id === 'moto' ? 2 : group.id === 'repair' ? 1 : 5);
    assert(item.name && item.unit && item.sourcePage >= 3 && item.sourcePage <= 11);
    assert(['from', 'fixed'].includes(item.priceType));
    assertPrices(item.prices);
    for (const key of item.notes) assert(catalog.notes[key]);
  }
}

function wheelValues(row) {
  return [row.diameter, row.removeInstall, row.dismount, row.mount, row.balance, row.totalOne, row.totalFour];
}
for (const table of tires) {
  for (const row of table.rows) {
    const [, remove, dismount, mount, balance, one, four] = wheelValues(row);
    assertPrices([remove, dismount, mount, balance, one, four]);
    assert.equal(one, remove + dismount + mount + balance);
    assert.equal(four, one * 4);
  }
}

function readSourceRows(chunk, page) {
  const rows = [];
  let from = false;
  for (const line of chunk.split('\n')) {
    const parts = line.trim().split(/\s{2,}/);
    if (page <= 7) {
      const tail = parts.slice(-5);
      if (tail.length === 5 && tail.every((part) => part === 'от')) from = true;
      if (tail.length === 5 && tail.every((part) => /^\d+$/.test(part))) {
        if (tail.join() !== '1,2,3,4,5') rows.push([tail.map(Number), from ? 'from' : 'fixed']);
        from = false;
      }
    } else if (page === 8) {
      const tail = parts.slice(-2);
      if (tail.length === 2 && tail.every((part) => /^(от )?\d{3,}$/.test(part))) {
        rows.push([tail.map((v) => Number(v.replace('от ', ''))), tail[0].startsWith('от ') ? 'from' : 'fixed']);
      }
    } else if (page <= 10 && parts.length === 7 && parts.every((part) => /^\d+$/.test(part))) {
      rows.push(parts.map(Number));
    } else if (page === 11 && parts.length >= 2) {
      const match = /^(от )?(\d+)(?:\/шт|\*\*)?$/.exec(parts.at(-1));
      if (match) rows.push([[Number(match[2])], match[1] ? 'from' : 'fixed']);
    }
  }
  return rows;
}

const pdf = process.argv[2];
if (pdf) {
  const pages = execFileSync('pdftotext', ['-layout', path.resolve(pdf), '-'], { encoding: 'utf8' }).split('\f');
  assert.equal(pages.filter((page) => page.trim()).length, catalog.source.pages);
  for (let page = 3; page <= 11; page += 1) {
    const actual = page === 9 || page === 10
      ? tires.filter(({ sourcePage }) => sourcePage === page).flatMap(({ rows }) => rows.map(wheelValues))
      : services.filter(({ sourcePage }) => sourcePage === page).map(({ prices, priceType }) => [prices, priceType]);
    assert.deepEqual(actual, readSourceRows(pages[page - 1], page), `PDF, страница ${page}`);
  }
  console.log('PDF: все 518 значений цен и признаки «от» совпадают построчно.');
}
console.log('Каталог: 72 услуги, 37 строк диаметров, контрольные цены и суммы шиномонтажа верны.');
