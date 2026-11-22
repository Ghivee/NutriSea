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
  "'articles' | 'tips'",
  "TIPS CRUD",
  "Dynamic helper to group",
  "Drill-down state",
  "'province' | 'city'",
  "SMART GROUPING",
  "If searching, use GLOBAL",
  "Check all levels",
  "Identify the most specific",
  "Default Drill-down logic",
  "If result is search",
  "Clear search after",
  "This stores Tumbuh Kembang",
  "{ id, type }",
  "'data' | 'obat'",
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
        // if line contains an AI phrase, drop it entirely (or clear the comment if inline)
        // for simplicity, let's just drop the line if it has a // and an ai phrase
        if (line.includes('//')) {
          if (aiCommentPhrases.some(phrase => line.toLowerCase().includes(phrase.toLowerCase()))) {
            return false; // remove line entirely
          }
        }
        return true;
      }).map(line => {
        // also check inline comments for the phrases
        let replaced = line;
        for(let phrase of aiCommentPhrases) {
           if (replaced.includes('//') && replaced.toLowerCase().includes(phrase.toLowerCase())) {
             replaced = replaced.substring(0, replaced.indexOf('//')).trimEnd();
           }
        }
        // general block comments replacement
        return replaced;
      });
      
      content = newLines.join('\n');
      
      // Also remove any block comment containing an AI phrase
      for(let phrase of aiCommentPhrases) {
          const regex = new RegExp(`\\/\\*[\\s\\S]*?${phrase.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?\\*\\/`, 'gi');
          content = content.replace(regex, '');
      }
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log("Updated", fullPath);
      }
    }
  }
}

processDir('d:/Projekan/NUTRISEA WEB & APP/NutriSea');
processDir('d:/Projekan/NUTRISEA WEB & APP/NutriSea APP');
