'use strict';

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#site-nav');
menuButton.hidden = false;
menu.dataset.ready = '';

function closeMenu(restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', String(menuButton.getAttribute('aria-expanded') === 'false'));
});
menu.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
window.matchMedia('(min-width: 64rem)').addEventListener('change', () => closeMenu());

const rubles = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function formatPrice(price, type = 'fixed') {
  return `${type === 'from' ? 'от ' : ''}${rubles.format(price)} ₽`;
}
