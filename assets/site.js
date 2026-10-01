const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
if (toggle && nav) {
  const closeMenu = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
  window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);
}
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
