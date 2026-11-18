'use strict';

const items = new Map(window.priceCatalog.groups.flatMap(({ items }) => items.map((item) => [item.id, item])));

for (const marker of document.querySelectorAll('[data-feature]')) {
  const item = items.get(marker.dataset.feature);
  marker.querySelector('span').textContent = formatPrice(item.prices[0], 'from');
}

const popular = document.querySelector('#popular-list');
for (const id of ['technical', 'euro-standard', 'euro-complex', 'four-posts']) {
  const item = items.get(id);
  const line = document.createElement('li');
  const name = document.createElement('a');
  name.href = `prices.html#${item.id}`;
  name.textContent = item.name;
  const price = document.createElement('strong');
  price.textContent = formatPrice(item.prices[0], item.priceType);
  line.append(name, price);
  popular.append(line);
}

// Add owner-provided images here. Each entry can include srcset and sizes for responsive delivery.
const photos = {
  'hero': { src: 'assets/photos/hero.webp', alt: 'Mercedes в моечном боксе «4 Поста»' },
  'wash': { src: 'assets/photos/wash-8555.webp', alt: 'Audi в пене и смыв водой' },
  'interior': { src: 'assets/photos/interior-8557.webp', alt: 'Ручная чистка обивки светлого сиденья' },
  'polish': { src: 'assets/photos/polish.webp', alt: 'Полировка двери синего автомобиля' },
  'tires': { src: 'assets/photos/tires-8556.webp', alt: 'Шиномонтаж: снятие колеса и ремонт прокола' },
  'gallery-1': { src: 'assets/photos/gallery-1.webp', alt: 'Общий вид боксов автомойки «4 Поста»' },
  'gallery-2': { src: 'assets/photos/gallery-2.webp', alt: 'Ручная чистка светлого сиденья Mercedes' },
  'gallery-3': { src: 'assets/photos/gallery-3.webp', alt: 'Подкапотное пространство до и после мойки' },
  'gallery-4': { src: 'assets/photos/gallery-4.webp', alt: 'Передняя часть салона со стороны пассажира' },
  'gallery-5': { src: 'assets/photos/gallery-5.webp', alt: 'Обивка сиденья крупным планом, два кадра' },
  'gallery-6': { src: 'assets/photos/gallery-6.webp', alt: 'Задние сиденья и коврик в салоне' },
  'entrance': { src: 'assets/photos/entrance.webp', alt: 'Въезд под навесом с парковочным знаком' },
};

const dialog = document.querySelector('#lightbox');
const enlarged = dialog.querySelector('img');
let activePhoto;

for (const frame of document.querySelectorAll('[data-photo]')) {
  const photo = photos[frame.dataset.photo];
  if (!photo) continue;
  const isHero = frame.dataset.photo === 'hero';
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt;
  img.loading = isHero ? 'eager' : 'lazy';
  img.decoding = 'async';
  if (isHero) img.fetchPriority = 'high';
  if (photo.srcset) img.srcset = photo.srcset;
  if (photo.sizes) img.sizes = photo.sizes;

  if (frame.classList.contains('gallery-media')) {
    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = 'photo-trigger';
    opener.setAttribute('aria-label', `Увеличить фото: ${photo.alt}`);
    opener.append(img);
    opener.addEventListener('click', () => {
      activePhoto = opener;
      enlarged.src = photo.full || photo.src;
      enlarged.alt = photo.alt;
      dialog.showModal();
    });
    frame.replaceChildren(opener);
  } else {
    frame.replaceChildren(img);
  }
  frame.classList.add('has-photo');
  frame.removeAttribute('aria-label');
}

dialog.addEventListener('close', () => activePhoto?.focus());
