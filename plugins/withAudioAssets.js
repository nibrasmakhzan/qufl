// ينسخ مجلد audio/ (نطق الكلمات والجمل) إلى android/app/src/main/assets/audio وقت prebuild.
// الكود الأصلي (Audio.kt) يشغّل الملفات من هناك بدون إنترنت.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withAudioAssets(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'audio');
      const dst = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets', 'audio');
      fs.rmSync(dst, { recursive: true, force: true });
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.cpSync(src, dst, { recursive: true });
      }
      return cfg;
    },
  ]);
};
