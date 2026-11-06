// إعداد التطبيق يتغيّر حسب اللغة المختارة (src/data/lang.json، ينحط بـ tools/use-lang.js).
// رقم النسخة: زيده هنا مع كل بناء جديد، وهو نفسه للتطبيقات الثلاثة.
const lang = require('./src/data/lang.json');

const VERSION_CODE = 20;
const VERSION_NAME = '2.0.0';

module.exports = () => ({
  expo: {
    name: lang.appName,
    slug: lang.slug,
    version: VERSION_NAME,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0B0D12',
    android: {
      package: lang.package,
      versionCode: VERSION_CODE,
      permissions: ['android.permission.USE_EXACT_ALARM', 'android.permission.SCHEDULE_EXACT_ALARM'],
      adaptiveIcon: {
        backgroundColor: '#0B0D12',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      'expo-build-properties',
      ['expo-localization', { supportsRTL: true, forcesRTL: true }],
      'expo-font',
      ['expo-notifications', { color: lang.accent }],
      './plugins/withAudioAssets.js',
    ],
    extra: {
      supportsRTL: true,
      forcesRTL: true,
      eas: { projectId: lang.projectId },
    },
    owner: '3_ts',
  },
});
