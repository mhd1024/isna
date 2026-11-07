# Isna Ramdaniah — Landing Page

Situs statis (HTML + CSS + JS). Buka `index.html` lewat server lokal apa saja, misalnya `npm run serve` atau `python3 -m http.server`.

- `assets/js/main.js`: navigasi, scroll-spy, tema gelap/terang, reveal, expand.
- `src/liquid.js`: efek foto cair (Three.js). Dibundel ke `assets/js/liquid.js` dengan `npm install && npm run build`, lalu dimuat lazy setelah halaman selesai dimuat. Efek ini dilewati kalau pengguna memilih reduced-motion, mengaktifkan Data Saver, atau browsernya tidak mendukung WebGL. Dalam kondisi itu foto biasa tetap tampil.
- Ganti alamat email dan tautan Instagram/YouTube di `index.html` (cari `example.com`, `instagram.com`, `youtube.com`).
