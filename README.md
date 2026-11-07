# Isna Ramdaniah — Landing Page

Dibangun dengan **Astro** (output statis) + **Tailwind CSS v4**.

| Kebutuhan | Library |
|---|---|
| Framework / build | Astro, Vite, optimasi gambar `astro:assets` (sharp) |
| Styling | Tailwind CSS v4 (token warna di `src/styles/global.css`) |
| Animasi | GSAP: ScrollTrigger, SplitText, DrawSVG, Flip |
| Smooth scroll | Lenis |
| 3D / efek cair | Three.js (`src/scripts/liquid.js`, dimuat lazy) |
| Carousel journey (HP) | Embla Carousel |
| Tooltip skill | Floating UI |
| Lihat foto | PhotoSwipe |
| Kartu miring | Vanilla Tilt |

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # hasil di dist/, siap di-upload ke hosting statis mana pun
npm run preview
```

## Mengubah konten

- Teks journey, daftar skill + tooltip, email, dan link sosial ada di `src/data/site.ts`.
- Foto ada di `src/assets/` (ganti file dengan nama yang sama).
- Domain untuk og:image ada di `astro.config.mjs` (`site`).

Animasi otomatis mati kalau pengguna memilih *reduced motion*. Efek Three.js dilewati juga untuk mode hemat data (Save-Data) dan browser tanpa WebGL.

## Deploy (GitHub Pages)

Setiap push ke `main` atau `claude/gifted-dirac-tbibxi` otomatis di-build lalu dipublikasikan oleh `.github/workflows/deploy.yml` ke
**https://mhd1024.github.io/isna/**

Sekali saja di awal: buka **Settings → Pages**, lalu set **Source** ke **GitHub Actions**.
