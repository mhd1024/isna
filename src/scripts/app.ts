/* Interaksi halaman.
   GSAP (ScrollTrigger, SplitText, DrawSVG, Flip) + Lenis untuk gerak,
   Embla untuk journey di layar kecil, Floating UI untuk tooltip skill,
   PhotoSwipe untuk melihat foto, Vanilla Tilt untuk kartu, Three.js (lazy) untuk foto cair. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';
import EmblaCarousel from 'embla-carousel';
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/dom';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import VanillaTilt from 'vanilla-tilt';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Flip);

const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- tema ---------- */
const meta = $<HTMLMetaElement>('meta[name="theme-color"]');
function applyTheme(t: string, persist: boolean) {
  root.dataset.theme = t;
  meta?.setAttribute('content', t === 'dark' ? '#1d1613' : '#fbf5ee');
  $('[data-theme-toggle]')?.setAttribute('aria-pressed', String(t === 'dark'));
  if (persist) { try { localStorage.setItem('isna-theme', t); } catch { /* storage diblokir */ } }
}
applyTheme(root.dataset.theme || 'light', false);
$('[data-theme-toggle]')?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

/* ---------- smooth scroll (Lenis) ---------- */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToHash(hash: string) {
  const el = hash === '#home' ? document.body : $(hash);
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: hash === '#home' ? 0 : -72, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', hash);
}
document.addEventListener('click', e => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.getAttribute('href') === '#') return;
  e.preventDefault();
  setMenu(false);
  scrollToHash(a.getAttribute('href')!);
});

/* ---------- nav ---------- */
const nav = $('[data-nav]')!;
const menu = $('#menu')!;
const burger = $('[data-burger]')!;
const pill = $('.nav-pill', menu);
const links = $$<HTMLAnchorElement>('a', menu);

ScrollTrigger.create({ start: 24, end: 'max', onToggle: s => nav.classList.toggle('is-stuck', s.isActive) });

function setMenu(open: boolean) {
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  if (open) lenis?.stop(); else lenis?.start();
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

function movePill(a?: HTMLElement | null) {
  if (!a || !pill) return;
  pill.style.setProperty('--l', `${a.offsetLeft}px`);
  pill.style.setProperty('--w', `${a.offsetWidth}px`);
  pill.style.setProperty('--o', '1');
}
const activeLink = () => $('.is-active', menu);
function setActive(hash: string) {
  const a = links.find(l => l.getAttribute('href') === hash);
  if (!a || a.classList.contains('is-active')) return;
  links.forEach(l => { l.classList.toggle('is-active', l === a); l.toggleAttribute('aria-current', l === a); });
  movePill(a);
}
links.forEach(a => a.addEventListener('pointerenter', () => movePill(a)));
menu.addEventListener('pointerleave', () => movePill(activeLink()));
document.fonts?.ready.then(() => movePill(activeLink()));
addEventListener('resize', () => movePill(activeLink()), { passive: true });

['home', 'about', 'journey', 'skills', 'thoughts'].forEach(id => {
  ScrollTrigger.create({
    trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
    onToggle: s => s.isActive && setActive(`#${id}`),
  });
});
ScrollTrigger.create({ start: () => ScrollTrigger.maxScroll(window) - 4, end: 'max', onEnter: () => setActive('#contact'), onLeaveBack: () => setActive('#thoughts') });

/* ---------- tombol: tetesan dari titik kursor ---------- */
$$('.btn').forEach(b => b.addEventListener('pointerenter', e => {
  const r = b.getBoundingClientRect();
  b.style.setProperty('--x', `${e.clientX - r.left}px`);
  b.style.setProperty('--y', `${e.clientY - r.top}px`);
}));

/* ---------- gerak (GSAP) ---------- */
const mm = gsap.matchMedia();
mm.add({ motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 900px)' }, ctx => {
  const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean };
  gsap.set('[data-intro]', { visibility: 'visible' });
  if (!motion) return;

  // Hero: huruf "mengalir" naik dari balik garis
  const split = SplitText.create('[data-hero-title] > span', { type: 'lines,chars', mask: 'lines' });
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from(split.chars, { yPercent: 110, rotate: 6, duration: 1.3, stagger: 0.022 })
    .from('[data-intro]:not([data-hero-title])', { y: 16, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.35)
    .fromTo('#home [data-draw] path', { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.2, ease: 'power2.inOut', stagger: 0.25 }, 0.5);

  // Blob krem berubah bentuk perlahan, seperti tetesan
  gsap.to('[data-blob]', {
    borderRadius: '58% 42% 40% 60% / 60% 55% 45% 40%', y: -14, rotate: 6,
    duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1,
  });

  // Parallax ringan di hero
  if (wide) {
    gsap.to('[data-hero-media]', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('[data-blob]', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Muncul saat masuk layar
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, clearProps: 'transform' }),
  });

  // Coretan & garis bawah judul digambar
  $$('[data-draw]').filter(s => !s.closest('#home')).forEach(svg => {
    gsap.fromTo($$('path', svg), { drawSVG: '0%' }, {
      drawSVG: '100%', duration: 1.4, ease: 'power2.inOut', delay: 0.3,
      scrollTrigger: { trigger: svg, start: 'top 90%', once: true },
    });
  });

  // Timeline: garis mengalir lalu kartu menyusul
  gsap.from('[data-line]', { scaleX: 0, duration: 1.6, ease: 'power3.inOut', scrollTrigger: { trigger: '[data-timeline]', start: 'top 85%', once: true } });
  gsap.from('[data-step]', { y: 36, autoAlpha: 0, duration: 1, ease: 'back.out(1.4)', stagger: 0.12, clearProps: 'transform', scrollTrigger: { trigger: '[data-timeline]', start: 'top 85%', once: true } });

  gsap.from('[data-chip]:not([hidden])', { x: -18, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, clearProps: 'transform', scrollTrigger: { trigger: '[data-chips]', start: 'top 88%', once: true } });

  // Kutipan banner: kata demi kata
  const words = SplitText.create('[data-split]', { type: 'words' });
  gsap.from(words.words, { y: 12, autoAlpha: 0, filter: 'blur(4px)', duration: 0.9, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '[data-split]', start: 'top 90%', once: true } });

  // Bunga bergoyang
  gsap.to('[data-sway]', { rotate: 18, scale: 1.04, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('[data-breeze]', { rotate: -5, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  return () => { split.revert(); words.revert(); };
});

/* ---------- buka/tutup konten ---------- */
function setLabel(btn: HTMLElement, open: boolean) {
  btn.setAttribute('aria-expanded', String(open));
  const l = $('[data-closed]', btn);
  if (l) l.textContent = open ? l.dataset.open! : l.dataset.closed!;
}
$$('[data-toggle]').forEach(btn => {
  const targets = $$(btn.dataset.toggle!);
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    setLabel(btn, open);
    gsap.to(targets, {
      height: open ? 'auto' : 0, autoAlpha: open ? 1 : 0,
      duration: reduce ? 0 : 0.7, ease: 'expo.out', stagger: open ? 0.06 : 0,
      onUpdate: () => ScrollTrigger.refresh(),
    });
  });
});

// Skill tambahan: Flip agar chip lain bergeser dengan mulus
const skillBtn = $('[data-skills-toggle]');
skillBtn?.addEventListener('click', () => {
  const chips = $$('[data-chip]');
  const extras = chips.slice(8);
  const open = skillBtn.getAttribute('aria-expanded') !== 'true';
  const state = Flip.getState(chips);
  extras.forEach(c => { c.hidden = !open; });
  setLabel(skillBtn, open);
  Flip.from(state, {
    duration: reduce ? 0 : 0.7, ease: 'expo.out', absolute: true,
    onEnter: els => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }),
    onLeave: els => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.3 }),
    onComplete: () => ScrollTrigger.refresh(),
  });
});

/* ---------- tooltip skill (Floating UI) ---------- */
const tip = document.createElement('div');
tip.className = 'tip';
tip.setAttribute('role', 'tooltip');
tip.id = 'skill-tip';
const tipText = document.createElement('span');
const tipArrow = document.createElement('span');
tipArrow.className = 'tip-arrow';
tip.append(tipText, tipArrow);
document.body.append(tip);
let stopTip: (() => void) | null = null;
function showTip(el: HTMLElement) {
  tipText.textContent = el.dataset.tip || '';
  el.setAttribute('aria-describedby', 'skill-tip');
  stopTip?.();
  stopTip = autoUpdate(el, tip, () => {
    computePosition(el, tip, { placement: 'top', middleware: [offset(10), flip(), shift({ padding: 12 }), arrow({ element: tipArrow })] })
      .then(({ x, y, placement, middlewareData }) => {
        Object.assign(tip.style, { left: `${x}px`, top: `${y}px` });
        const a = middlewareData.arrow;
        const side = placement.startsWith('top') ? 'bottom' : 'top';
        Object.assign(tipArrow.style, { left: a?.x != null ? `${a.x}px` : '', top: '', bottom: '', [side]: '-4px' });
      });
  });
  tip.classList.add('is-on');
}
function hideTip(el: HTMLElement) {
  el.removeAttribute('aria-describedby');
  tip.classList.remove('is-on');
  stopTip?.(); stopTip = null;
}
$$('[data-chip]').forEach(c => {
  c.addEventListener('pointerenter', () => showTip(c));
  c.addEventListener('pointerleave', () => hideTip(c));
  c.addEventListener('focus', () => showTip(c));
  c.addEventListener('blur', () => hideTip(c));
});

/* ---------- journey: carousel di layar kecil (Embla) ---------- */
const emblaRoot = $('[data-embla]');
const dotsWrap = $('[data-embla-dots]');
if (emblaRoot && dotsWrap) {
  const embla = EmblaCarousel(emblaRoot, {
    align: 'start', containScroll: 'trimSnaps', container: '[data-timeline]',
    breakpoints: { '(min-width: 900px)': { active: false } },
  });
  const renderDots = () => {
    dotsWrap.innerHTML = '';
    if (!embla.internalEngine().options.active) return;
    embla.scrollSnapList().forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'h-2 w-2 rounded-full bg-line-2 transition-all duration-500 aria-[current=true]:w-6 aria-[current=true]:bg-gold';
      b.setAttribute('aria-label', `Langkah ${i + 1}`);
      b.addEventListener('click', () => embla.scrollTo(i));
      dotsWrap.append(b);
    });
    syncDots();
  };
  const syncDots = () => [...dotsWrap.children].forEach((d, i) => d.setAttribute('aria-current', String(i === embla.selectedScrollSnap())));
  embla.on('init', renderDots).on('reInit', renderDots).on('select', syncDots);
  renderDots();
}

/* ---------- lihat foto (PhotoSwipe) ---------- */
const lightbox = new PhotoSwipeLightbox({
  gallery: 'main', children: 'a[data-pswp]',
  pswpModule: () => import('photoswipe'),
  bgOpacity: 0.92, showHideAnimationType: 'zoom',
});
lightbox.on('beforeOpen', () => lenis?.stop());
lightbox.on('destroy', () => lenis?.start());
lightbox.init();

/* ---------- kartu miring mengikuti kursor (Vanilla Tilt) ---------- */
if (finePointer && !reduce) {
  VanillaTilt.init($$('[data-tilt]'), { max: 6, speed: 900, scale: 1.02, glare: false, perspective: 900, easing: 'cubic-bezier(.22,1,.36,1)' });
}

/* ---------- foto cair (Three.js), dimuat paling akhir ---------- */
function canWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function bootLiquid() {
  // @ts-expect-error: properti non-standar
  if (reduce || navigator.connection?.saveData || !canWebGL()) return;
  import('./liquid.js')
    .then(({ mountLiquid }) => $$('[data-liquid]').forEach(el => mountLiquid(el, el.dataset.liquid!)))
    .catch(err => console.warn('[liquid] dilewati:', err));
}
const idle = window.requestIdleCallback || ((fn: () => void) => setTimeout(fn, 200));
if (document.readyState === 'complete') idle(bootLiquid);
else addEventListener('load', () => idle(bootLiquid), { once: true });

root.classList.remove('js');
