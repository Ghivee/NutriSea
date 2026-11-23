# NutriSea

NutriSea pairs a product idea with the public health problem it is meant to address: childhood stunting in Indonesia, which is driven in large part by protein and micronutrient gaps in early childhood diets. The product is a functional-food gummy made from marine fauna (fish-based protein in a form kids will actually eat, unlike a plain fish dish), and this repository holds the two web projects built around it.

[Baca dalam Bahasa Indonesia di bawah](#bahasa-indonesia)

| Folder | What it is | Stack |
| --- | --- | --- |
| `landing/` | The marketing site that presents the product and the idea behind it, for potential customers, partners or judges to read | React, Vite, Tailwind CSS, Radix UI, Framer Motion |
| `webapp/` | The actual tracker app: parent accounts and an admin area for the health information behind the product | React, Vite, React Router, Supabase, Framer Motion |

## landing

```bash
cd landing
npm install
npm run dev
npm run build
```

## webapp

The app has login, registration and password reset, a home page for parents, and admin pages for child (balita) data, patient data, educational content, compliance tracking and quizzes. It is built directly on the Bilova codebase (an unrelated antibiotic-adherence app this team had already written), reused here because the underlying pattern, a patient-facing tracker paired with an admin dashboard, fit the stunting-tracking need closely enough to build on rather than start over; its commit history includes Bilova's original commits as a result.

```bash
cd webapp
npm install
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run deploy` publishes `webapp/dist` to GitHub Pages using `gh-pages`. Before that, run the SQL in `webapp/database/nutrisea_schema.sql` in the Supabase SQL editor to create the tables; `migration_complete.sql` and `final_nutrisea_setup.sql` in the same folder hold later schema changes to apply afterward.

`landing/` and `webapp/` come from the former NutriSea-Platform and NutriSea-WebApp repositories, merged into this one together with their own commit histories, rather than starting fresh and losing that history.

---

## Bahasa Indonesia

NutriSea memasangkan sebuah gagasan produk dengan masalah kesehatan masyarakat yang ingin dijawabnya: stunting pada anak di Indonesia, yang sebagian besar didorong oleh kekurangan protein dan mikronutrien di masa awal pertumbuhan anak. Produknya adalah gummy pangan fungsional dari fauna laut (protein berbasis ikan dalam bentuk yang benar-benar mau dimakan anak, tidak seperti hidangan ikan biasa), dan repositori ini menyimpan dua proyek web yang dibangun di sekitarnya.

### Folder

| Folder | Isi | Teknologi |
| --- | --- | --- |
| `landing/` | Situs pemasaran yang memperkenalkan produk dan gagasan di baliknya, untuk calon pelanggan, mitra, atau juri | React, Vite, Tailwind CSS, Radix UI, Framer Motion |
| `webapp/` | Aplikasi pelacak sesungguhnya: akun orang tua dan area admin untuk informasi kesehatan di balik produk | React, Vite, React Router, Supabase, Framer Motion |

### landing

```bash
cd landing
npm install
npm run dev
npm run build
```

### webapp

Aplikasi ini punya login, pendaftaran, dan reset kata sandi, beranda untuk orang tua, serta halaman admin untuk data balita, data pasien, materi edukasi, pelacakan kepatuhan, dan kuis. Aplikasi ini dibangun langsung di atas basis kode Bilova (aplikasi kepatuhan antibiotik yang tidak berkaitan, sudah lebih dulu ditulis tim ini), dipakai ulang di sini karena pola dasarnya, pelacak untuk pasien dipasangkan dengan dashboard admin, cukup cocok dengan kebutuhan pelacakan stunting untuk dikembangkan lebih lanjut daripada dimulai dari nol; riwayat commit-nya karena itu memuat commit asli Bilova.

```bash
cd webapp
npm install
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run deploy` menerbitkan `webapp/dist` ke GitHub Pages lewat `gh-pages`. Sebelum itu, jalankan SQL di `webapp/database/nutrisea_schema.sql` pada SQL editor Supabase untuk membuat tabel; `migration_complete.sql` dan `final_nutrisea_setup.sql` di folder yang sama menyimpan perubahan skema berikutnya untuk diterapkan setelahnya.

`landing/` dan `webapp/` berasal dari repositori NutriSea-Platform dan NutriSea-WebApp yang dulu terpisah, digabung ke repositori ini beserta riwayat commit-nya masing-masing, bukan dimulai dari nol dan kehilangan riwayat itu.
