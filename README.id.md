# NutriSea

Dua proyek web untuk NutriSea, gagasan pangan fungsional: gummy dari fauna laut, dipasangkan dengan pelacak gizi yang bertujuan mencegah stunting pada anak.

[English](README.md)

| Folder | Isi | Teknologi |
| --- | --- | --- |
| `landing/` | Situs pemasaran yang memperkenalkan produk dan gagasannya | React, Vite, Tailwind CSS, Radix UI, Framer Motion |
| `webapp/` | Aplikasi pelacak: akun orang tua dan area admin | React, Vite, React Router, Supabase, Framer Motion |

## landing

```bash
cd landing
npm install
npm run dev
npm run build
```

## webapp

Aplikasi ini punya login, pendaftaran, reset kata sandi, beranda untuk orang tua, serta halaman admin untuk data balita, data pasien, materi edukasi, kepatuhan, dan kuis. Dasarnya kode Bilova, jadi riwayatnya memuat commit awal Bilova.

```bash
cd webapp
npm install
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run deploy` menerbitkan `webapp/dist` ke GitHub Pages lewat `gh-pages`. Jalankan dulu `webapp/database/nutrisea_schema.sql` pada SQL editor Supabase; `migration_complete.sql` dan `final_nutrisea_setup.sql` berisi perubahan berikutnya.

`landing/` dan `webapp/` berasal dari repositori NutriSea-Platform dan NutriSea-WebApp yang dulu terpisah, digabung di sini beserta riwayatnya.
