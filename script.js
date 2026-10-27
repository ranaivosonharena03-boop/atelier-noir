/* ATELIER NOIR — lightweight interactions, no dependencies. */
'use strict';

document.documentElement.classList.add('js');

const header = document.querySelector('#site-header');
const progress = document.querySelector('#scroll-progress');
const heroPhoto = document.querySelector('.hero-photo');
const mobileToggle = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#primary-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Header state and scroll progress share one requestAnimationFrame.
let scrollQueued = false;
function updateScroll() {
  const current = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle('scrolled', current > 35);
  progress.style.width = `${maxScroll > 0 ? current / maxScroll * 100 : 0}%`;
  // Subtle hero movement only on sufficiently large screens.
  if (!reduceMotion.matches && window.innerWidth > 760 && current < window.innerHeight) {
    heroPhoto.style.transform = `scale(1.045) translate3d(0, ${current * 0.065}px, 0)`;
  }
  if (reduceMotion.matches || window.innerWidth <= 760) heroPhoto.style.transform = "";
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    requestAnimationFrame(updateScroll);
    scrollQueued = true;
  }
}, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();

// Mobile navigation is keyboard and screen-reader accessible.
function closeMenu(returnFocus = false) {
  mobileNav.classList.remove('is-open');
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('menu-open');
  document.querySelector("main").inert = false;
  document.querySelector("footer").inert = false;
  if (returnFocus) mobileToggle.focus();
}
mobileToggle.addEventListener('click', () => {
  const shouldOpen = mobileToggle.getAttribute('aria-expanded') !== 'true';
  if (!shouldOpen) return closeMenu();
  mobileNav.classList.add('is-open');
  mobileToggle.setAttribute('aria-expanded', 'true');
  mobileToggle.setAttribute('aria-label', 'Close navigation');
  document.body.classList.add('menu-open');
  document.querySelector('main').inert = true;
  document.querySelector('footer').inert = true;
  mobileNav.querySelector('a')?.focus();
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
window.addEventListener('keydown', event => {
  if (event.key === 'Tab' && mobileNav.classList.contains('is-open')) {
    const items = [...mobileNav.querySelectorAll('a'), mobileToggle];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) closeMenu(true);
});
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

// Reveal animations progressively enhance the static page.
const reveals = document.querySelectorAll('.reveal');
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  reveals.forEach(element => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -35px 0px', threshold: 0.06 });
  reveals.forEach(element => observer.observe(element));
}

// Working project filters with an accessible result announcement.
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project-card')];
const filterStatus = document.querySelector('#filter-status');
filterButtons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  filterButtons.forEach(other => {
    const isCurrent = other === button;
    other.classList.toggle('is-active', isCurrent);
    other.setAttribute('aria-pressed', String(isCurrent));
  });
  let count = 0;
  cards.forEach(card => {
    const visible = category === 'all' || card.dataset.category === category;
    card.hidden = !visible;
    if (visible) count += 1;
  });
  document.querySelector('#projects-grid').classList.toggle('is-filtered', category !== 'all');
  updateScroll();
  filterStatus.textContent = `${count} ${count === 1 ? 'study' : 'studies'} shown.`;
}));

// Case studies are editorial CONCEPTS, not claims of built/commissioned work.
const studies = [
  {
    id: 'solace', number: '01', title: 'Solace House', type: 'RESIDENTIAL / CONCEPT',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=82',
    alt: 'Light-colored luxury villa surrounded by greenery and a swimming pool',
    description: 'An imagined retreat shaped by warmth, openness, and a gentle relationship with its surroundings. Generous thresholds allow the outside world to become part of everyday life.'
  },
  {
    id: 'stillness', number: '02', title: 'Stillness', type: 'INTERIORS / CONCEPT',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=82',
    alt: 'Warm contemporary interior in neutral natural materials',
    description: 'An exploration of calm interiors: balanced proportions, tactile materials, and a soft palette. Nothing demands attention, but every detail rewards it.'
  },
  {
    id: 'terra', number: '03', title: 'Terra Residence', type: 'RESIDENTIAL / CONCEPT',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=82',
    alt: 'Contemporary residence with white exterior and garden',
    description: 'A concept for family life inspired by uninterrupted sightlines, open-air rituals, and restrained architectural gestures that make the ordinary feel considered.'
  },
  {
    id: 'monolith', number: '04', title: 'Monolith', type: 'EXPERIMENTAL / CONCEPT',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=82',
    alt: 'White sculptural modern architectural building',
    description: 'An abstract study in geometry and shadow. The tension between solid forms and empty space becomes an invitation to look more closely.'
  }
];
const dialog = document.querySelector('#project-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogKicker = document.querySelector('#dialog-kicker');
const dialogImage = document.querySelector('#dialog-image');
const dialogDescription = document.querySelector('#dialog-description');
let activeStudy = 0;
let previousFocus = null;

function populateStudy(index) {
  activeStudy = index;
  const study = studies[index];
  dialogTitle.textContent = study.title;
  dialogKicker.textContent = `STUDY ${study.number} / 04 — ${study.type}`;
  dialogDescription.textContent = study.description;
  dialogImage.src = study.image;
  dialogImage.srcset = [600, 1100, 1800].map(width => `${study.image.replace(/w=\d+/, `w=${width}`)} ${width}w`).join(', ');
  dialogImage.sizes = '(max-width: 760px) 100vw, 1060px';
  dialogImage.alt = study.alt;
}

document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const index = studies.findIndex(study => study.id === button.dataset.project);
  if (index < 0) return;
  previousFocus = button;
  populateStudy(index);
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.scrollTop = 0;
    document.querySelector('#dialog-close').focus();
  } else {
    // Graceful fallback for very old browsers.
    dialog.setAttribute('open', '');
  }
}));
const closeDialog = () => dialog.close();
document.querySelector('#dialog-close').addEventListener('click', closeDialog);
document.querySelector('#dialog-next').addEventListener('click', () => {
  populateStudy((activeStudy + 1) % studies.length);
  dialogTitle.focus({preventScroll:true});
  dialog.scrollTop = 0;
});
dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  previousFocus?.focus({preventScroll:true});
});

// Keep the copyright date current while leaving the case-study year fixed.
document.querySelector('#year').textContent = new Date().getFullYear();
