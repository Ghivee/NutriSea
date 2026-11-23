# NutriSea

Two web projects for NutriSea, a functional-food idea: gummies made from marine fauna, paired with a nutrition tracker aimed at preventing stunting in children.

[Bahasa Indonesia](README.id.md)

| Folder | What it is | Stack |
| --- | --- | --- |
| `landing/` | The marketing site that presents the product and the idea | React, Vite, Tailwind CSS, Radix UI, Framer Motion |
| `webapp/` | The tracker app: accounts for parents and an admin area | React, Vite, React Router, Supabase, Framer Motion |

## landing

```bash
cd landing
npm install
npm run dev
npm run build
```

## webapp

The app has login, registration and password reset, a home page for parents, and admin pages for child data, patient data, education content, compliance and quizzes. It is built on the Bilova codebase, and its history includes Bilova's first commits.

```bash
cd webapp
npm install
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run deploy` publishes `webapp/dist` to GitHub Pages with `gh-pages`. Run `webapp/database/nutrisea_schema.sql` in the Supabase SQL editor first; `migration_complete.sql` and `final_nutrisea_setup.sql` hold later changes.

`landing/` and `webapp/` come from the former NutriSea-Platform and NutriSea-WebApp repositories, merged here with their histories.
