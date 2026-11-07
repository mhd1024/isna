/* Semua konten yang sering diubah ada di sini. */
export const site = {
  name: 'Isna Ramdaniah',
  email: 'isna.ramdaniah@example.com', // TODO: ganti
  instagram: 'https://www.instagram.com/', // TODO: ganti
  youtube: 'https://www.youtube.com/', // TODO: ganti
};

export const nav = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#journey', label: 'Journey' },
  { href: '#skills', label: 'Portfolio' },
  { href: '#thoughts', label: 'Thoughts' },
  { href: '#contact', label: 'Contact' },
];

export const journey = [
  { icon: 'cap', title: 'Mahasiswa UT PGSD', text: 'Terus belajar dan meraih cita-cita', more: 'Semester 5 · Universitas Terbuka. Kuliah sambil mengajar, teori langsung diuji di kelas.' },
  { icon: 'kids', title: 'Guru Pendamping RA Anak Kreatif', text: 'Menemani tumbuh kembang anak', more: 'Mendampingi kegiatan harian, literasi awal, dan hafalan surat pendek.' },
  { icon: 'heart-fill', title: 'Calon Istri & Ibu', text: 'Membangun keluarga penuh cinta', more: 'Rumah adalah sekolah pertama. Aku ingin menjadi guru terbaik di sana juga.' },
  { icon: 'star', title: 'Versi Terbaik Diri', text: 'Dengan doa, usaha, dan kesabaran', more: 'Pelan-pelan, tapi tidak berhenti.' },
] as const;

export type SkillIcon = 'home' | 'class' | 'literacy' | 'quran' | 'leaf' | 'write' | 'people' | 'tech' | 'story' | 'media';
export const skills: { icon: SkillIcon; label: string; note: string; extra?: boolean }[] = [
  { icon: 'home', label: 'Pendidikan & Pembelajaran (PAUD–SD)', note: 'Merancang kegiatan sesuai tahap perkembangan anak usia dini hingga SD.' },
  { icon: 'class', label: 'Manajemen Kelas', note: 'Rutinitas, aturan bersama, dan transisi kegiatan yang tenang.' },
  { icon: 'literacy', label: 'Literasi & Numerasi', note: 'Membaca nyaring, mengenal huruf, dan bermain angka.' },
  { icon: 'quran', label: 'Tahfidz & Keislaman', note: 'Murajaah surat pendek, doa harian, dan adab.' },
  { icon: 'leaf', label: 'Pengembangan Kurikulum', note: 'Menyusun modul ajar Kurikulum Merdeka yang kontekstual.' },
  { icon: 'write', label: 'Menulis & Dokumentasi', note: 'Catatan anekdot dan laporan perkembangan anak.' },
  { icon: 'people', label: 'Komunikasi & Kolaborasi', note: 'Bekerja sama dengan guru kelas dan orang tua.' },
  { icon: 'tech', label: 'Adaptasi Teknologi', note: 'Canva, Google Workspace, dan media belajar digital.' },
  { icon: 'story', label: 'Bercerita & Mendongeng', note: 'Cerita bergambar dan boneka tangan.', extra: true },
  { icon: 'media', label: 'Media Pembelajaran Kreatif', note: 'Alat peraga dari bahan sederhana di sekitar.', extra: true },
];
