// حفظ التقدم على الموبايل نفسه، والنسخ الاحتياطي (نص تنسخه وتلصقه).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrate, State } from './srs';
import { lang } from './lang';

const KEY = 'qufl-state-v1';
const PREFIX = 'QUFL-BACKUP';

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return migrate(null);
}

export async function saveState(s: State) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

/** نص النسخة الاحتياطية: سطر تعريف + التقدم كـ JSON. */
export function exportBackup(s: State): string {
  return `${PREFIX}:${lang.code}:${JSON.stringify(s)}`;
}

/** يرجّع التقدم من النص، أو رسالة خطأ واضحة. */
export function importBackup(text: string): { state?: State; error?: string } {
  const t = text.trim();
  const m = t.match(/^QUFL-BACKUP:(en|tr|es):([\s\S]+)$/);
  if (!m) return { error: 'هذا مو نص نسخة احتياطية من قُفل. انسخ النص كامل من أوله لآخره.' };
  if (m[1] !== lang.code) return { error: `هالنسخة الاحتياطية مال تطبيق لغة ثانية (${m[1]}).` };
  try {
    return { state: migrate(JSON.parse(m[2])) };
  } catch {
    return { error: 'النص ناقص أو تغيّر. انسخه مرة ثانية كامل.' };
  }
}
