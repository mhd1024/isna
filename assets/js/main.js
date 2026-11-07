/* Isna Ramdaniah — interaksi halaman.
   Tanpa dependensi; Three.js hanya dimuat (lazy) untuk efek cair. */

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- tema ---------- */
const themeBtn = $('[data-theme-toggle]');
const metaThemes = $$('meta[name="theme-color"]');
function applyTheme(t, persist) {
  root.dataset.theme = t;
  metaThemes.forEach(m => m.setAttribute('content', t === 'dark' ? '#1d1613' : '#fbf5ee'));
  themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  if (persist) { try { localStorage.setItem('isna-theme', t); } catch (e) { /* storage diblokir */ } }
}
applyTheme(root.dataset.theme || 'light', false);
themeBtn.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

/* ---------- nav: sticky, burger, scroll-spy, pill ---------- */
const nav = $('[data-nav]');
const menu = $('#menu');
const burger = $('.nav__burger');
const pill = $('.nav__pill');
const links = $$('a', menu);

let stuck = false;
const onScroll = () => {
  const s = scrollY > 24;
  if (s !== stuck) { stuck = s; nav.classList.toggle('is-stuck', s); }
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
links.forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

function movePill(a) {
  if (!a || !pill) return;
  pill.style.setProperty('--l', a.offsetLeft + 'px');
  pill.style.setProperty('--w', a.offsetWidth + 'px');
  pill.style.setProperty('--o', '1');
}
function setActive(hash) {
  const a = links.find(l => l.getAttribute('href') === hash);
  if (!a || a.classList.contains('is-active')) return;
  links.forEach(l => { l.classList.toggle('is-active', l === a); l.toggleAttribute('aria-current', l === a); });
  movePill(a);
}
// pill mengikuti hover, kembali ke link aktif saat keluar
links.forEach(a => a.addEventListener('pointerenter', () => movePill(a)));
menu.addEventListener('pointerleave', () => movePill($('.is-active', menu)));
document.fonts?.ready.then(() => movePill($('.is-active', menu)));
addEventListener('resize', () => movePill($('.is-active', menu)), { passive: true });
movePill($('.is-active', menu));

const spyMap = { home: '#home', about: '#about', journey: '#journey', skills: '#skills', thoughts: '#thoughts' };
const spy = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) setActive(spyMap[e.target.id]);
}, { rootMargin: '-45% 0px -50% 0px' });
Object.keys(spyMap).forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
// paling bawah = Contact
addEventListener('scroll', () => {
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) setActive('#contact');
}, { passive: true });

/* ---------- reveal saat masuk layar ---------- */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    $$('.doodle', e.target).forEach(d => d.classList.add('is-drawn'));
    io.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
$$('.reveal, [data-timeline]').forEach(el => io.observe(el));

/* ---------- tombol: titik awal "tetesan" mengikuti kursor ---------- */
$$('.btn').forEach(b => b.addEventListener('pointerenter', e => {
  const r = b.getBoundingClientRect();
  b.style.setProperty('--x', `${e.clientX - r.left}px`);
  b.style.setProperty('--y', `${e.clientY - r.top}px`);
}));

/* ---------- expand / collapse ---------- */
$$('[data-expand]').forEach(btn => {
  const target = $(btn.dataset.expand);
  const label = $('[data-label-closed]', btn);
  if (!target) return;
  btn.addEventListener('click', () => {
    const open = !target.classList.contains('is-open');
    target.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? label.dataset.labelOpen : label.dataset.labelClosed;
  });
});

/* ---------- tahun footer ---------- */
const y = $('[data-year]');
if (y) y.textContent = new Date().getFullYear();

/* ---------- efek cair (Three.js), dimuat belakangan ---------- */
function canWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}
function bootLiquid() {
  if (reduceMotion.matches || navigator.connection?.saveData || !canWebGL()) return;
  import('./liquid.js')
    .then(({ mountLiquid }) => $$('[data-liquid]').forEach(el => mountLiquid(el, el.dataset.liquid)))
    .catch(err => console.warn('[liquid] dilewati:', err));
}
const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
if (document.readyState === 'complete') idle(bootLiquid);
else addEventListener('load', () => idle(bootLiquid), { once: true });
