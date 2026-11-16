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
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);
}
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

const journey = document.querySelector('.sword-journey');
if (journey) {
  const sections = journey.querySelector('.journey-sections');
  const chapters = journey.querySelector('.journey-chapters');
  const chapterToggle = chapters.querySelector('summary');
  const sceneToggle = journey.querySelector('.lite-toggle');
  const status = journey.querySelector('.journey-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = matchMedia('(max-width: 700px), (max-width: 950px) and (pointer: coarse)');
  let sceneRequest;

  const setExpanded = (expanded) => {
    sections.hidden = !expanded;
    journey.classList.toggle('is-collapsed', !expanded);
  };
  const isChapter = (hash) => /^#tecnologia-[1-9]$/.test(hash);
  setExpanded(isChapter(location.hash));

  const startScene = () => {
    if (sceneRequest) return;
    sceneToggle.disabled = true;
    sceneToggle.textContent = 'Cargando 3D…';
    status.textContent = 'Cargando la espada 3D.';
    sceneRequest = import(new URL(journey.dataset.scene, document.baseURI).href).catch(() => {
      sceneToggle.textContent = '3D no disponible';
      status.textContent = 'Vista ligera · 3D no disponible';
    });
  };

  sceneToggle.hidden = false;
  sceneToggle.addEventListener('click', startScene);
  if (!compactScreen.matches && !reducedMotion.matches) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !compactScreen.matches && !reducedMotion.matches) {
        observer.disconnect();
        startScene();
      }
    }, { threshold: 0.2 });
    observer.observe(journey.querySelector('.journey-intro'));
  }

  journey.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isChapter(link.getAttribute('href'))) {
      setExpanded(true);
      if (link.classList.contains('journey-start') && !reducedMotion.matches) startScene();
    }
    if (link.classList.contains('journey-skip')) setExpanded(false);
    if (chapters.contains(link)) chapters.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chapters.open) {
      chapters.open = false;
      if (chapters.contains(document.activeElement)) chapterToggle.focus();
    }
  });
  window.addEventListener('hashchange', () => {
    if (sections.hidden && isChapter(location.hash)) {
      setExpanded(true);
      document.getElementById(location.hash.slice(1)).scrollIntoView({ behavior: 'instant' });
    }
  });
}

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

const revealLinkedProject = () => {
  const id = location.hash.slice(1);
  const project = document.getElementById(id)?.closest('.project');
  if (project?.classList.contains('project')) project.querySelector('details').open = true;
};
revealLinkedProject();
window.addEventListener('hashchange', revealLinkedProject);

const evidenceViewer = document.querySelector('#evidence-viewer');
if (evidenceViewer) {
  let pictures = [];
  let pictureIndex = 0;
  const image = evidenceViewer.querySelector('#evidence-viewer-image');
  const caption = evidenceViewer.querySelector('#evidence-viewer-caption');
  const count = evidenceViewer.querySelector('#evidence-viewer-count');
  const previous = evidenceViewer.querySelector('[data-gallery-prev]');
  const next = evidenceViewer.querySelector('[data-gallery-next]');
  const showPicture = (index) => {
    pictureIndex = (index + pictures.length) % pictures.length;
    const button = pictures[pictureIndex];
    image.src = button.dataset.galleryImage;
    image.alt = button.querySelector('img').alt;
    caption.textContent = button.dataset.galleryCaption;
    count.textContent = `${pictureIndex + 1} / ${pictures.length}`;
    previous.disabled = next.disabled = pictures.length < 2;
  };
  document.querySelectorAll('[data-gallery-image]').forEach(button => {
    button.addEventListener('click', () => {
      const gallery = button.closest('.evidence-gallery');
      pictures = [...gallery.querySelectorAll('[data-gallery-image]')];
      evidenceViewer.querySelector('#evidence-viewer-title').textContent = gallery.dataset.project;
      showPicture(pictures.indexOf(button));
      evidenceViewer.showModal();
    });
  });
  evidenceViewer.querySelector('.evidence-close').addEventListener('click', () => evidenceViewer.close());
  previous.addEventListener('click', () => showPicture(pictureIndex - 1));
  next.addEventListener('click', () => showPicture(pictureIndex + 1));
  evidenceViewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPicture(pictureIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  evidenceViewer.addEventListener('click', event => {
    const rect = evidenceViewer.getBoundingClientRect();
    if (event.target === evidenceViewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) evidenceViewer.close();
  });
}
