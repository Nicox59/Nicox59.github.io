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

document.querySelectorAll('[data-copy-email]').forEach((button) => {
  button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail;
    const status = document.getElementById(button.getAttribute('aria-describedby'));
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'Correo copiado.';
    } catch {
      const link = button.closest('.contact-option').querySelector('[data-email-address]');
      const range = document.createRange();
      range.selectNodeContents(link);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'No se pudo copiar automáticamente. Selecciona el correo y cópialo con Ctrl+C o manteniendo pulsado.';
    }
  });
});
