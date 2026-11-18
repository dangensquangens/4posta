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
  // hero: { src: 'assets/photos/hero.webp', alt: 'Описание реальной фотографии' },
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

if (document.querySelector('.gallery-media.has-photo')) {
  document.querySelector('#gallery-status').hidden = true;
}
dialog.addEventListener('close', () => activePhoto?.focus());
