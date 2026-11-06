// يجهّز المشروع للغة وحدة قبل البناء: ينسخ الكلمات والإعدادات والأيقونات والصوتيات.
// الاستعمال: node tools/use-lang.js tr   (en | tr | es)
const fs = require('fs');
const path = require('path');
const code = process.argv[2];
const root = path.join(__dirname, '..');
const dir = path.join(root, 'langs', code);
if (!code || !fs.existsSync(dir)) {
  console.error('usage: node tools/use-lang.js en|tr|es');
  process.exit(1);
}
fs.copyFileSync(path.join(dir, 'words.json'), path.join(root, 'src', 'data', 'words.json'));
fs.copyFileSync(path.join(dir, 'lang.json'), path.join(root, 'src', 'data', 'lang.json'));
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
  fs.copyFileSync(path.join(dir, f), path.join(root, 'assets', f));
}
// الصوتيات: langs/<code>/audio → audio (تنحط بالـ APK عن طريق plugins/withAudioAssets.js)
const audioSrc = path.join(dir, 'audio');
const audioDst = path.join(root, 'audio');
fs.rmSync(audioDst, { recursive: true, force: true });
if (fs.existsSync(audioSrc)) fs.cpSync(audioSrc, audioDst, { recursive: true });
console.log(`using ${code}: ${JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8')).length} words,`,
  fs.existsSync(audioDst) ? `${fs.readdirSync(audioDst).length} audio files` : 'no audio');
