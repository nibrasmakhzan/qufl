// منطق الحفظ: الكلمات الجديدة، المراجعة المتباعدة، الأسئلة، والإحصائيات.
import WORDS from './data/words.json';
import { lang } from './lang';

export type Word = { w: string; ar: string; ex: string };
export const words: Word[] = WORDS as Word[];
export const TOTAL = words.length;

export const NEED_NEW = 3; // كل كلمة جديدة لازم تنجاوب صح 3 مرات
export const INTERVALS = [1, 3, 7, 14, 30, 60]; // أيام المراجعة المتباعدة
export const MAX_REVIEWS = 30;
export const GOALS = [5, 10, 15, 20];
export const MASTER_BOX = 4; // من هنا وفوق: الكلمة «متقنة»

export type Card = { box: number; due: string };
export type DayLog = { n: number; ok: number; bad: number }; // كلمات جديدة، صح، غلط
export type State = {
  pos: number; // رقم الكلمة الجديدة الجاية بالقائمة
  cards: Record<string, Card>;
  streak: number;
  best: number;
  lastDone: string | null;
  emerg: string[];
  lockMin: number;
  remind: boolean;
  perDay: number;
  wrong: Record<string, number>; // كم مرة غلطت بكل كلمة
  fav: string[];
  log: Record<string, DayLog>;
  onboarded: boolean;
  autoPlay: boolean;
};

export const emptyState = (): State => ({
  pos: 0,
  cards: {},
  streak: 0,
  best: 0,
  lastDone: null,
  emerg: [],
  lockMin: 16 * 60,
  remind: false,
  perDay: 10,
  wrong: {},
  fav: [],
  log: {},
  onboarded: false,
  autoPlay: true,
});

/** يكمّل الحقول الناقصة من نسخة قديمة أو من نسخة احتياطية. */
export function migrate(raw: any): State {
  const s = { ...emptyState(), ...(raw || {}) } as State & { next?: number };
  if (raw && typeof raw.pos !== 'number') s.pos = (raw.next ?? 0) * 10;
  if (raw && raw.onboarded === undefined) s.onboarded = !!raw.lastDone || Object.keys(raw.cards || {}).length > 0;
  delete s.next;
  return s;
}

// ---------- التواريخ ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dstr(new Date());
export function addDays(s: string, n: number) {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(y, m - 1, d);
  t.setDate(t.getDate() + n);
  return dstr(t);
}
export const nowMinute = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
export function formatTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const part = h < 5 ? 'بالليل' : h < 12 ? 'الصبح' : h < 16 ? 'الظهر' : h < 19 ? 'العصر' : 'بالليل';
  return `${h12}:${String(m).padStart(2, '0')} ${part}`;
}

export function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const indexByWord = new Map(words.map((w, i) => [w.w, i]));

// ---------- جلسة اليوم ----------
export function newBatch(s: State, n = s.perDay): number[] {
  const out: number[] = [];
  for (let i = s.pos; i < words.length && out.length < n; i++) {
    if (!s.cards[words[i].w]) out.push(i);
  }
  return out;
}

export function dueReviews(s: State, t = today()): number[] {
  return Object.entries(s.cards)
    .filter(([, c]) => c.due <= t)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
    .map(([w]) => indexByWord.get(w))
    .filter((i): i is number => i !== undefined)
    .slice(0, MAX_REVIEWS);
}

export type Item = { idx: number; need: number; got: number; isNew: boolean; wrong: boolean };

export const makeItems = (newIdx: number[], reviewIdx: number[]): Item[] => [
  ...newIdx.map((idx) => ({ idx, need: NEED_NEW, got: 0, isNew: true, wrong: false })),
  ...reviewIdx.map((idx) => ({ idx, need: 1, got: 0, isNew: false, wrong: false })),
];

const learnedIdx = (s: State) =>
  Object.keys(s.cards)
    .map((w) => indexByWord.get(w))
    .filter((i): i is number => i !== undefined);

/** تمرين حر: كلمات عشوائية من المحفوظة (ما يغيّر المواعيد). */
export const practiceItems = (s: State, n = 10): Item[] =>
  shuffle(learnedIdx(s))
    .slice(0, n)
    .map((idx) => ({ idx, need: 1, got: 0, isNew: false, wrong: false }));

/** الكلمات الصعبة: أكثر كلمات غلطت بيها. */
export function hardWords(s: State, n = 30): number[] {
  return Object.entries(s.wrong)
    .filter(([w, k]) => k > 0 && s.cards[w])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => indexByWord.get(w))
    .filter((i): i is number => i !== undefined);
}
export const hardItems = (s: State): Item[] =>
  hardWords(s, 10).map((idx) => ({ idx, need: 1, got: 0, isNew: false, wrong: false }));

export const favItems = (s: State): Item[] =>
  shuffle(s.fav.map((w) => indexByWord.get(w)).filter((i): i is number => i !== undefined))
    .slice(0, 10)
    .map((idx) => ({ idx, need: 1, got: 0, isNew: false, wrong: false }));

// ---------- الأسئلة ----------
export type Kind = 'meaning' | 'type' | 'blank' | 'listen';

export function kindFor(it: Item): Kind {
  let k: Kind = it.isNew
    ? (['meaning', 'type', 'blank'] as Kind[])[Math.min(it.got, 2)]
    : (['type', 'blank', 'listen', 'meaning'] as Kind[])[Math.floor(Math.random() * 4)];
  if (k === 'blank' && !blankSentence(words[it.idx])) k = 'type';
  return k;
}

const LETTER = /[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞş]/;
const lower = (s: string) =>
  (lang.code === 'tr' ? s.replace(/İ/g, 'i').replace(/I/g, 'ı') : s).toLowerCase();

function findWord(sentence: string, word: string): number {
  const S = lower(sentence);
  const W = lower(word);
  let from = 0;
  for (;;) {
    const i = S.indexOf(W, from);
    if (i < 0) return -1;
    const before = i === 0 ? '' : S[i - 1];
    const after = S[i + W.length] ?? '';
    if (!LETTER.test(before) && !LETTER.test(after)) return i;
    from = i + 1;
  }
}

export function blankSentence(w: Word): string | null {
  const i = findWord(w.ex, w.w);
  return i < 0 ? null : w.ex.slice(0, i) + '_____' + w.ex.slice(i + w.w.length);
}

const fold = (s: string) => {
  let out = lower(s);
  for (const [k, v] of Object.entries(lang.fold)) out = out.split(k).join(v);
  return out;
};
const norm = (s: string) =>
  fold(s)
    .replace(/[’`]/g, "'")
    .replace(/[.!?,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const checkTyped = (input: string, w: Word) => norm(input) === norm(w.w);

/** 4 اختيارات بمعاني (أو كلمات) مختلفة. */
export function choices(idx: number, by: 'ar' | 'w' = 'ar'): number[] {
  const seen = new Set([words[idx][by]]);
  const out = [idx];
  for (const k of shuffle(words.map((_, i) => i))) {
    if (out.length === 4) break;
    if (seen.has(words[k][by])) continue;
    seen.add(words[k][by]);
    out.push(k);
  }
  return shuffle(out);
}

// ---------- النتائج ----------
export type Result = { ok: number; bad: number; wrongWords: string[] };

function logDay(s: State, t: string, add: Partial<DayLog>): Record<string, DayLog> {
  const cur = s.log[t] ?? { n: 0, ok: 0, bad: 0 };
  return {
    ...s.log,
    [t]: { n: cur.n + (add.n ?? 0), ok: cur.ok + (add.ok ?? 0), bad: cur.bad + (add.bad ?? 0) },
  };
}

/** عدّاد الأغلاط: يزيد للكلمة اللي غلطت بيها، وينقص للكلمة اللي جاوبتها صح بدون غلط. */
function addWrong(s: State, list: string[], items: Item[] = []) {
  const wrong = { ...s.wrong };
  for (const it of items) {
    const w = words[it.idx].w;
    if (!it.wrong && wrong[w]) wrong[w] = Math.max(0, wrong[w] - 1);
  }
  for (const w of list) wrong[w] = (wrong[w] ?? 0) + 1;
  for (const w of Object.keys(wrong)) if (!wrong[w]) delete wrong[w];
  return wrong;
}

/** نهاية جلسة اليوم (أو دفعة كلمات زيادة). */
export function finishDay(s: State, items: Item[], r: Result, t = today()): State {
  const cards = { ...s.cards };
  let fresh = 0;
  let maxIdx = s.pos - 1;
  for (const it of items) {
    const w = words[it.idx].w;
    if (it.isNew) {
      fresh++;
      maxIdx = Math.max(maxIdx, it.idx);
      cards[w] = { box: 0, due: addDays(t, INTERVALS[0]) };
    } else {
      const old = cards[w] ?? { box: 0, due: t };
      const box = it.wrong ? 0 : Math.min(old.box + 1, INTERVALS.length - 1);
      cards[w] = { box, due: addDays(t, INTERVALS[box]) };
    }
  }
  const streak = s.lastDone === addDays(t, -1) ? s.streak + 1 : s.lastDone === t ? s.streak : 1;
  return {
    ...s,
    cards,
    pos: Math.max(s.pos, maxIdx + 1),
    streak,
    best: Math.max(s.best, streak),
    lastDone: t,
    wrong: addWrong(s, r.wrongWords, items.filter((x) => !x.isNew)),
    log: logDay(s, t, { n: fresh, ok: r.ok, bad: r.bad }),
  };
}

/** نتيجة تمرين حر: تنحسب بالإحصائيات بس، ما تغيّر المواعيد. */
export function finishPractice(s: State, items: Item[], r: Result, t = today()): State {
  return { ...s, wrong: addWrong(s, r.wrongWords, items), log: logDay(s, t, { ok: r.ok, bad: r.bad }) };
}

/** «أعرفها»: الكلمة تنحسب محفوظة وترجع للمراجعة بعد شهر. */
export function markKnown(s: State, idx: number, t = today()): State {
  const w = words[idx].w;
  return { ...s, cards: { ...s.cards, [w]: { box: MASTER_BOX, due: addDays(t, INTERVALS[MASTER_BOX]) } } };
}

export const toggleFav = (s: State, w: string): State => ({
  ...s,
  fav: s.fav.includes(w) ? s.fav.filter((x) => x !== w) : [...s.fav, w],
});

export const emergencyAllowed = (s: State, t = today()) => !s.emerg.some((d) => d > addDays(t, -7));

// ---------- الإحصائيات والإنجازات ----------
export function summary(s: State) {
  const cards = Object.values(s.cards);
  const learned = cards.length;
  const mastered = cards.filter((c) => c.box >= MASTER_BOX).length;
  const learning = cards.filter((c) => c.box >= 1 && c.box < MASTER_BOX).length;
  const fresh = cards.filter((c) => c.box === 0).length;
  const logs = Object.values(s.log);
  const ok = logs.reduce((a, l) => a + l.ok, 0);
  const bad = logs.reduce((a, l) => a + l.bad, 0);
  const accuracy = ok + bad ? Math.round((ok / (ok + bad)) * 100) : 0;
  const days = Object.keys(s.log).length;
  return { learned, mastered, learning, fresh, ok, bad, accuracy, days };
}

export type Badge = { id: string; title: string; desc: string; done: boolean };

export function badges(s: State): Badge[] {
  const x = summary(s);
  const b = (id: string, title: string, desc: string, done: boolean) => ({ id, title, desc, done });
  return [
    b('first', 'البداية', 'خلّصت أول جلسة', x.learned > 0),
    b('s3', '3 أيام', 'سلسلة 3 أيام ورا بعض', s.best >= 3),
    b('s7', 'أسبوع كامل', 'سلسلة 7 أيام', s.best >= 7),
    b('s30', 'شهر حديد', 'سلسلة 30 يوم', s.best >= 30),
    b('w100', '100 كلمة', 'تعلمت 100 كلمة', x.learned >= 100),
    b('w500', '500 كلمة', 'تعلمت 500 كلمة', x.learned >= 500),
    b('w1000', '1000 كلمة', 'تعلمت 1000 كلمة', x.learned >= 1000),
    b('m100', 'متقن', 'أتقنت 100 كلمة', x.mastered >= 100),
    b('acc', 'دقيق', 'دقة 90٪ أو أكثر بعد 200 جواب', x.ok + x.bad >= 200 && x.accuracy >= 90),
  ];
}
