// يضيف توقيع "release" لملف android/app/build.gradle اللي يسوّيه expo prebuild.
// كلمات السر ما تنكتب بالملف: تنقرأ وقت البناء من الملف اللي بـ QUFL_SIGNING_PROPS.
const fs = require('fs');
const file = process.argv[2];
let g = fs.readFileSync(file, 'utf8');

const release = `
        release {
            def p = new Properties()
            file(System.getenv("QUFL_SIGNING_PROPS")).withInputStream { p.load(it) }
            storeFile file(p.getProperty("storeFile"))
            storePassword p.getProperty("storePassword")
            keyAlias p.getProperty("keyAlias")
            keyPassword p.getProperty("keyPassword")
        }`;

const sc = g.indexOf('signingConfigs {');
if (sc < 0) throw new Error('signingConfigs block not found');
g = g.slice(0, sc + 'signingConfigs {'.length) + release + g.slice(sc + 'signingConfigs {'.length);

const bt = g.indexOf('buildTypes {');
const rel = g.indexOf('release {', bt);
const use = g.indexOf('signingConfig signingConfigs.debug', rel);
if (bt < 0 || rel < 0 || use < 0) throw new Error('release buildType signing line not found');
g = g.slice(0, use) + 'signingConfig signingConfigs.release' + g.slice(use + 'signingConfig signingConfigs.debug'.length);

fs.writeFileSync(file, g);
console.log('signing patched');
