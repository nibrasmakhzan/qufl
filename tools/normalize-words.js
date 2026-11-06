// يحوّل قوائم الكلمات القديمة ({en|tr|es, ar, ex}) لشكل موحّد: {w, ar, ex}.
// الاستعمال: node tools/normalize-words.js
const fs = require('fs');
const path = require('path');
for (const code of ['en', 'tr', 'es']) {
  const dir = path.join(__dirname, '..', 'langs', code);
  const src = path.join(dir, 'words-src.json');
  if (!fs.existsSync(src)) continue;
  const list = JSON.parse(fs.readFileSync(src, 'utf8')).map((x) => ({ w: x[code] ?? x.w, ar: x.ar, ex: x.ex }));
  fs.writeFileSync(path.join(dir, 'words.json'), '[\n' + list.map((w) => JSON.stringify(w)).join(',\n') + '\n]\n');
  fs.unlinkSync(src);
  console.log(code, list.length);
}
