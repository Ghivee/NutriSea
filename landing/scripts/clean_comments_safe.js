const fs = require('fs');
const path = require('path');

const aiCommentPhrases = [
  "Konfigurasi Vite",
  "Area utama yang",
  "Fungsi untuk",
  "Apabila web tidak memiliki",
  "Komponen Pratinjau Tautan",
  "Jika tidak statis",
  "Konfigurasi pergeseran posisi",
  "Blokir perenderan kartu sementara",
  "Melacak seberapa jauh pergeseran",
  "Download gambar secara sembunyi",
  "Wadah Pemicu Utama",
  "Antarmuka Visual Pratinjau",
  "Konfigurasi variasi tampilan",
  "Memudahkan pengelolaan",
  "Menyiapkan tipe prop standar",
  "Izinkan tombol digunakan sebagai pembungkus",
  "Komponen Tombol Fungsional",
  "Jika diberikan 'asChild'",
  "Komponen Utama Aplikasi",
  "Base path logic",
  "Use root for local dev",
  "For GitHub Pages production",
  "Note: Vercel environment",
  "If we have profile data",
  "If profile is still loading",
  "Filter for logs with",
  "If after some time",
  "Add User message",
  "Simulate AI response",
  "primitive keyword matching",
  "Build weekly calendar",
  "Check if already",
  "TIPS CRUD",
  "Dynamic helper to group",
  "Drill-down state",
  "SMART GROUPING",
  "If searching, use GLOBAL",
  "Check all levels",
  "Identify the most specific",
  "Default Drill-down logic",
  "If result is search",
  "Clear search after",
  "This stores Tumbuh Kembang",
  "Strict Validation",
  "Compute patient compliance",
  "Get unique values",
  "Parse height and weight",
  "Fetch all in parallel",
  "Get compliance logs",
  "Pertumbuhan/Gejala in last",
  "Compute avg compliance",
  "Severe alerts =",
  "Flag untuk cek",
  "NutriSea Logo integration",
  "Safety timeout",
  "NutriSea loading screen",
  "Semua kata dirender invisible",
  "Halaman 1",
  "Halaman 2",
  "Halaman 3",
  "Tab: Pertumbuhan",
  "Tab: Jadwal Gummy",
  "Tab: Kepatuhan",
  "Delete confirmation",
  "Patient List",
  "Search & Region Filters",
  "Goal/Latest Card"
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', 'dist', 'build', '.git'].includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      const lines = content.split('\n');
      const newLines = lines.filter(line => {
        const trimmed = line.trim();
        // Remove the entire line if it's a full-line comment containing the AI phrase
        if (trimmed.startsWith('//') || trimmed.startsWith('{/*') || trimmed.startsWith('/*')) {
          if (aiCommentPhrases.some(phrase => line.toLowerCase().includes(phrase.toLowerCase()))) {
            return false; 
          }
        }
        return true;
      }).map(line => {
        let replaced = line;
        for(let phrase of aiCommentPhrases) {
           if (replaced.includes('//') && replaced.toLowerCase().includes(phrase.toLowerCase())) {
             // ensure it's not part of a url
             if (!replaced.includes('://')) {
                 replaced = replaced.substring(0, replaced.indexOf('//')).trimEnd();
             }
           }
        }
        return replaced;
      });
      
      content = newLines.join('\n');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log("Updated", fullPath);
      }
    }
  }
}

processDir('d:/Projekan/NUTRISEA WEB & APP/NutriSea');
processDir('d:/Projekan/NUTRISEA WEB & APP/NutriSea APP');
