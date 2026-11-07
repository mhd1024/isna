/* Efek "cair" untuk foto: simulasi kecepatan ringan (ping-pong FBO beresolusi rendah)
   yang digerakkan kursor/jari, lalu dipakai untuk membelokkan UV foto.
   - Satu loop rAF untuk semua instance; berhenti saat di luar layar / tab tersembunyi.
   - Sim berjalan di ~1/8 resolusi elemen; frame ditahan ke ~30fps saat tidak ada interaksi.
   - Foto diambil dari <img> yang sudah ada (tanpa unduhan ulang); <img> tetap jadi fallback. */
import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial,
  WebGLRenderTarget, Texture, Vector2, LinearFilter, HalfFloatType, UnsignedByteType,
  ClampToEdgeWrapping,
} from 'three';

const PRESETS = {
  // mask 1 = tepi kiri bergelombang memudar ke latar (hero)
  hero:   { mask: 1, focus: [0.6, 0.42], breeze: 0.8, warp: 0.09, sway: 0.0 },
  // sway = bunga di bagian bawah bergoyang lebih kuat
  banner: { mask: 0, focus: [0.5, 1.0],  breeze: 0.6, warp: 0.11, sway: 1.0 },
};

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const SIM_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uVel;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uBurst;
  varying vec2 vUv;
  void main() {
    vec2 v0 = texture2D(uPrev, vUv).xy * 2.0 - 1.0;
    // self-advection: medan kecepatan membawa dirinya sendiri -> ekor cair
    vec4 a = texture2D(uPrev, vUv - v0 * 0.014);
    vec2 v = a.xy * 2.0 - 1.0;
    float ink = a.z;
    vec2 d = vUv - uMouse; d.x *= uAspect;
    float g = exp(-dot(d, d) / uRadius);
    v += uVel * g;
    ink += g * min(length(uVel) * 3.0, 0.6);
    // klik / tap: dorongan melingkar keluar, seperti tetesan jatuh ke air
    float gb = exp(-dot(d, d) / (uRadius * 3.0));
    v += normalize(d + 1e-5) * gb * uBurst;
    ink += gb * uBurst * 0.8;
    v *= 0.962;
    ink *= 0.95;
    gl_FragColor = vec4(clamp(v, -1.0, 1.0) * 0.5 + 0.5, clamp(ink, 0.0, 1.0), 1.0);
  }
`;

const VIEW_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uTex;
  uniform sampler2D uSim;
  uniform vec2 uRes;
  uniform vec2 uImg;
  uniform vec2 uFocus;
  uniform float uTime;
  uniform float uMask;
  uniform float uMaskDir; // 0 = memudar dari kiri (desktop), 1 = dari atas (HP)
  uniform float uBreeze;
  uniform float uSway;
  uniform float uWarp;
  uniform float uIntro;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  vec2 cover(vec2 uv) {
    float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
    vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
    return (uv - uFocus) * s + uFocus;
  }

  void main() {
    vec4 sim = texture2D(uSim, vUv);
    vec2 v = sim.xy * 2.0 - 1.0;
    v *= smoothstep(0.01, 0.05, length(v));           // buang derau kuantisasi
    float ink = sim.z;

    // angin lembut: daun / kelopak bergerak sangat pelan
    float n = noise(vUv * vec2(3.0, 5.0) + uTime * 0.12);
    vec2 breeze = vec2(sin(uTime * 0.8 + vUv.y * 8.0 + n * 5.0), cos(uTime * 0.6 + vUv.x * 6.0 + n * 3.0)) * 0.0016 * uBreeze;
    float stems = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.5);
    breeze.x += sin(uTime * 1.3 + vUv.x * 22.0 + n * 2.0) * 0.004 * uSway * stems;

    // intro: foto "menetes" masuk dari riak
    float intro = 1.0 - uIntro;
    vec2 introWarp = vec2(sin(vUv.y * 10.0 + uTime * 2.0), cos(vUv.x * 9.0 + uTime * 1.7)) * 0.02 * intro * intro;

    vec2 uv = vUv + breeze + introWarp + v * uWarp;
    vec2 c = cover(uv);
    float split = length(v) * 0.0015; // pecahan warna sangat tipis, cukup untuk kesan "lensa air"
    vec3 col;
    col.r = texture2D(uTex, c + v * split).r;
    col.g = texture2D(uTex, c).g;
    col.b = texture2D(uTex, c - v * split).b;
    // kilau tipis di punggung riak, seperti permukaan air
    col += ink * 0.05 * vec3(1.0, 0.96, 0.88);

    float a = 1.0;
    if (uMask > 0.5) {
      // tepi bergelombang: sumbu & arah tergantung tata letak
      float along = mix(vUv.y, vUv.x, uMaskDir);
      float across = mix(vUv.x + v.x * 0.04, 1.0 - vUv.y - v.y * 0.04, uMaskDir);
      float w = noise(vec2(along * 2.6, uTime * 0.18)) * 0.6 + noise(vec2(along * 7.0 - uTime * 0.25, 3.1)) * 0.25;
      float edge = 0.02 + w * 0.12 + (1.0 - uIntro) * 0.35;
      a = smoothstep(edge, edge + mix(0.3, 0.26, uMaskDir), across);
    }
    gl_FragColor = vec4(col * a, a);   // premultiplied alpha
  }
`;

/* ---------- loop bersama ---------- */
const active = new Set();
let rafId = 0;
let last = 0;
function tick(now) {
  rafId = active.size ? requestAnimationFrame(tick) : 0;
  const dt = Math.min((now - (last || now)) / 1000, 0.05);
  last = now;
  active.forEach(inst => inst.frame(now / 1000, dt));
}
function wake() { if (!rafId && active.size && !document.hidden) { last = 0; rafId = requestAnimationFrame(tick); } }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; } else wake();
});

/* ---------- instance ---------- */
export function mountLiquid(el, name) {
  const preset = PRESETS[name] || PRESETS.hero;
  const img = el.querySelector('img');
  if (!img) return;
  const ready = img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => new Promise(r => img.addEventListener('load', r, { once: true })));
  ready
    // ImageBitmap: ukuran tetap & terdekode di luar main thread (aman untuk <img> ber-srcset)
    .then(() => createImageBitmap(img, { imageOrientation: 'flipY', premultiplyAlpha: 'none' }).catch(() => img))
    .then(bmp => create(el, img, bmp, preset)).catch(err => console.warn('[liquid]', err));
}

function create(el, img, bmp, preset) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  el.insertBefore(canvas, img.nextSibling);

  const gl = renderer.getContext();
  const floatOK = renderer.capabilities.isWebGL2 &&
    (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
  const rtOpts = {
    type: floatOK ? HalfFloatType : UnsignedByteType,
    minFilter: LinearFilter, magFilter: LinearFilter,
    wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping,
    depthBuffer: false, stencilBuffer: false,
  };
  let rtA = new WebGLRenderTarget(4, 4, rtOpts);
  let rtB = new WebGLRenderTarget(4, 4, rtOpts);

  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new PlaneGeometry(2, 2);

  const simMat = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: SIM_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uPrev: { value: null }, uMouse: { value: new Vector2(-9, -9) }, uVel: { value: new Vector2() },
      uAspect: { value: 1 }, uRadius: { value: 0.009 }, uBurst: { value: 0 },
    },
  });
  const simScene = new Scene(); simScene.add(new Mesh(quad, simMat));

  const tex = new Texture(bmp);
  tex.flipY = bmp === img; // <img> perlu dibalik, ImageBitmap sudah dibalik
  tex.minFilter = LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;

  const viewMat = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: VIEW_FRAG, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uTex: { value: tex }, uSim: { value: null },
      uRes: { value: new Vector2(1, 1) }, uImg: { value: new Vector2(bmp.naturalWidth || bmp.width, bmp.naturalHeight || bmp.height) },
      uFocus: { value: new Vector2(...preset.focus) },
      uTime: { value: 0 }, uMask: { value: preset.mask }, uMaskDir: { value: 0 }, uBreeze: { value: preset.breeze },
      uSway: { value: preset.sway }, uWarp: { value: preset.warp }, uIntro: { value: 0 },
    },
  });
  const viewScene = new Scene(); viewScene.add(new Mesh(quad, viewMat));

  // bersihkan target sim ke "nol" (0.5 = kecepatan nol)
  function clearTargets() {
    renderer.setClearColor(0x808000, 1);
    [rtA, rtB].forEach(rt => { renderer.setRenderTarget(rt); renderer.clear(); });
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, 0);
  }

  /* ukuran */
  let w = 1, h = 1;
  function resize() {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    viewMat.uniforms.uRes.value.set(w, h);
    // foto selebar layar (HP) -> pudar dari atas; di samping teks (desktop) -> pudar dari kiri
    viewMat.uniforms.uMaskDir.value = w > innerWidth * 0.9 ? 1 : 0;
    const sw = Math.max(32, Math.min(256, Math.round(w / 7)));
    const sh = Math.max(16, Math.round(sw * h / w));
    rtA.setSize(sw, sh); rtB.setSize(sw, sh);
    simMat.uniforms.uAspect.value = w / h;
    clearTargets();
  }
  new ResizeObserver(resize).observe(el);
  resize();

  /* input: kursor & sentuhan, dipetakan ke UV elemen */
  const hit = el.closest('section') || el;
  const ptr = { x: -9, y: -9, px: null, py: null, vx: 0, vy: 0, burst: 0, lastInput: -1e9 };
  hit.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (ptr.px !== null) {
      // kecepatan dinormalisasi ke tinggi elemen agar terasa sama di semua ukuran
      ptr.vx += (e.clientX - ptr.px) / r.height * 7;
      ptr.vy -= (e.clientY - ptr.py) / r.height * 7;
    }
    ptr.px = e.clientX; ptr.py = e.clientY;
    ptr.x = x; ptr.y = y;
    ptr.lastInput = performance.now();
  }, { passive: true });
  hit.addEventListener('pointerleave', () => { ptr.px = null; }, { passive: true });
  hit.addEventListener('pointerdown', e => {
    if ((e.target).closest?.('a,button')) return;
    const r = el.getBoundingClientRect();
    ptr.x = (e.clientX - r.left) / r.width;
    ptr.y = 1 - (e.clientY - r.top) / r.height;
    ptr.burst = 0.9;
    ptr.lastInput = performance.now();
  }, { passive: true });

  /* frame */
  let t0 = null, odd = false, lost = false;
  const inst = {
    frame(time, dt) {
      if (lost) return;
      if (t0 === null) t0 = time;
      const calm = performance.now() - ptr.lastInput > 2500 && viewMat.uniforms.uIntro.value >= 1;
      odd = !odd;
      if (calm && odd) return; // ~30fps saat tenang

      const vel = simMat.uniforms.uVel.value;
      const len = Math.hypot(ptr.vx, ptr.vy);
      const k = len > 1 ? 1 / len : 1;
      vel.set(ptr.vx * k, ptr.vy * k);
      ptr.vx = 0; ptr.vy = 0;
      simMat.uniforms.uBurst.value = ptr.burst;
      ptr.burst *= 0.55; if (ptr.burst < 0.01) ptr.burst = 0;
      simMat.uniforms.uMouse.value.set(ptr.x, ptr.y);

      simMat.uniforms.uPrev.value = rtA.texture;
      renderer.setRenderTarget(rtB);
      renderer.render(simScene, cam);
      renderer.setRenderTarget(null);
      [rtA, rtB] = [rtB, rtA];

      const u = viewMat.uniforms;
      u.uSim.value = rtA.texture;
      u.uTime.value = time - t0;
      const before = u.uIntro.value;
      u.uIntro.value = Math.min(1, before + dt / 1.6);
      if (before < 1 && u.uIntro.value >= 1) el.classList.add('gl-done');
      renderer.render(viewScene, cam);
    },
  };

  // render pertama, baru tampilkan kanvas (fade silang dari <img>)
  inst.frame(0, 0);
  el.classList.add('is-gl');

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { active.add(inst); wake(); } else active.delete(inst);
  }, { rootMargin: '80px' }).observe(el);

  canvas.addEventListener('webglcontextlost', ev => {
    ev.preventDefault(); lost = true; active.delete(inst); el.classList.remove('is-gl');
  });
  void gl;
}
