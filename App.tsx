// نقطة البداية: تحمّل التقدم، التبويبات، وجلسات الدراسة.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ElMessiri_400Regular, ElMessiri_500Medium, ElMessiri_700Bold } from '@expo-google-fonts/el-messiri';
import { Lalezar_400Regular } from '@expo-google-fonts/lalezar';
import QuflLock from './modules/qufl-lock';
import { buzz, C, F, s } from './src/theme';
import {
  dueReviews,
  emergencyAllowed,
  favItems,
  finishDay,
  finishPractice,
  hardItems,
  Item,
  makeItems,
  markKnown,
  newBatch,
  nowMinute,
  practiceItems,
  Result,
  State,
  today,
  toggleFav,
} from './src/srs';
import { loadState, saveState } from './src/storage';
import { askPermission, scheduleReminders } from './src/reminder';
import Background from './src/fx/Background';
import Confetti from './src/fx/Confetti';
import Logo from './src/fx/Logo';
import Rise from './src/fx/Rise';
import GlowButton from './src/fx/GlowButton';
import TabBar, { Tab } from './src/ui/TabBar';
import Home, { Mode } from './src/screens/Home';
import Learn from './src/screens/Learn';
import Quiz from './src/screens/Quiz';
import Library from './src/screens/Library';
import Stats from './src/screens/Stats';
import Settings from './src/screens/Settings';
import Onboarding from './src/screens/Onboarding';

type Overlay = null | 'learn' | 'quiz' | 'done';

const TITLES: Record<Mode, string> = {
  day: 'جلسة اليوم',
  extra: 'كلمات زيادة',
  practice: 'تمرين حر',
  hard: 'الكلمات الصعبة',
  fav: 'المفضّلة',
};

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [mode, setMode] = useState<Mode>('day');
  const [items, setItems] = useState<Item[]>([]);
  const [batch, setBatch] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [perm, setPerm] = useState({ overlay: false, access: false, enabled: false });
  const [fontsLoaded] = useFonts({ ElMessiri_400Regular, ElMessiri_500Medium, ElMessiri_700Bold, Lalezar_400Regular });
  const stateRef = useRef<State | null>(null);
  stateRef.current = state;

  const refreshPerm = useCallback(() => {
    setPerm({
      overlay: QuflLock.canDrawOverlays(),
      access: QuflLock.isAccessibilityEnabled(),
      enabled: QuflLock.getState().enabled,
    });
  }, []);

  const update = useCallback((next: State) => {
    setState(next);
    saveState(next);
  }, []);
  const patch = (p: Partial<State>) => stateRef.current && update({ ...stateRef.current, ...p });

  useEffect(() => {
    loadState().then((st) => {
      const t = today();
      if (st.lastDone === t || st.emerg.includes(t)) QuflLock.setDoneDate(t);
      else if (st.lastDone) QuflLock.setDoneDate(st.lastDone);
      QuflLock.setLockTime(st.lockMin);
      scheduleReminders(st);
      setState(st);
    });
    refreshPerm();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && refreshPerm());
    return () => sub.remove();
  }, [refreshPerm]);

  const t = today();
  const lockOn = perm.enabled && perm.access;
  const lockedNow = !!state && lockOn && state.lastDone !== t && !state.emerg.includes(t) && nowMinute() >= state.lockMin;

  // زر الرجوع: من أي شاشة فرعية يرجع للرئيسية، إلا إذا الموبايل مقفول
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlay === 'done' || (overlay === 'learn' && !lockedNow)) {
        setOverlay(null);
        return true;
      }
      if (!overlay && tab !== 'home') {
        setTab('home');
        return true;
      }
      return lockedNow;
    });
    return () => sub.remove();
  }, [overlay, tab, lockedNow]);

  function finishEmptyDay() {
    if (!state) return;
    update(finishDay(state, [], { ok: 0, bad: 0, wrongWords: [] }));
    QuflLock.setDoneDate(t);
    setMode('day');
    setResult({ ok: 0, bad: 0, wrongWords: [] });
    setOverlay('done');
  }

  function startSession() {
    if (!state) return;
    const b = newBatch(state);
    const r = dueReviews(state);
    if (!b.length && !r.length) return finishEmptyDay();
    setMode('day');
    setBatch(b);
    setItems(makeItems(b, r));
    setOverlay(b.length ? 'learn' : 'quiz');
  }

  function startMode(m: Mode) {
    if (!state) return;
    if (m === 'day') return startSession();
    if (m === 'extra') {
      const b = newBatch(state);
      if (!b.length) return;
      setMode('extra');
      setBatch(b);
      setItems(makeItems(b, []));
      setOverlay('learn');
      return;
    }
    const it = m === 'hard' ? hardItems(state) : m === 'fav' ? favItems(state) : practiceItems(state);
    if (!it.length) return;
    setMode(m);
    setItems(it);
    setOverlay('quiz');
  }

  useEffect(() => {
    if (lockedNow && !overlay && state?.onboarded) startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedNow, overlay, state?.onboarded]);

  function onKnown(idx: number) {
    if (!state) return;
    update(markKnown(state, idx));
    const b = batch.filter((i) => i !== idx);
    const it = items.filter((x) => x.idx !== idx);
    setBatch(b);
    setItems(it);
    if (!b.length) {
      if (it.length) setOverlay('quiz');
      else if (mode === 'day') finishEmptyDay();
      else setOverlay(null);
    }
  }

  function onQuizDone(r: Result) {
    if (!state) return;
    let next: State;
    if (mode === 'day' || mode === 'extra') {
      next = finishDay(state, items, r);
      QuflLock.setDoneDate(t);
    } else next = finishPractice(state, items, r);
    update(next);
    scheduleReminders(next);
    buzz.good();
    setResult(r);
    setOverlay('done');
  }

  function onEmergency() {
    if (!state) return;
    update({ ...state, emerg: [...state.emerg, t] });
    QuflLock.setDoneDate(t);
    setOverlay(null);
  }

  async function onSetTime(min: number) {
    if (!state) return;
    QuflLock.setLockTime(min);
    const ok = await askPermission();
    const next = { ...state, lockMin: min, remind: ok || state.remind };
    update(next);
    scheduleReminders(next);
  }

  function onToggleLock(v: boolean) {
    QuflLock.setLockEnabled(v);
    refreshPerm();
  }

  let body: React.ReactNode;
  if (!state || !fontsLoaded) {
    body = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={150} hop={false} />
      </View>
    );
  } else if (!state.onboarded) {
    body = <Onboarding onDone={(perDay) => update({ ...state, perDay, onboarded: true })} />;
  } else if (overlay === 'learn') {
    body = (
      <Learn
        batch={batch}
        reviews={items.length - batch.length}
        autoPlay={state.autoPlay}
        fav={state.fav}
        onKnown={onKnown}
        onFav={(w) => update(toggleFav(state, w))}
        onReady={() => setOverlay('quiz')}
      />
    );
  } else if (overlay === 'quiz') {
    const lockedQuiz = lockedNow && mode === 'day';
    body = (
      <Quiz
        key={mode + items.length}
        items={items}
        title={TITLES[mode]}
        locked={lockedQuiz}
        canEmergency={lockedQuiz && emergencyAllowed(state)}
        onDone={onQuizDone}
        onEmergency={onEmergency}
        onQuit={() => setOverlay(null)}
      />
    );
  } else if (overlay === 'done') {
    const practice = mode === 'practice' || mode === 'hard' || mode === 'fav';
    const r = result ?? { ok: 0, bad: 0, wrongWords: [] };
    const acc = r.ok + r.bad ? Math.round((r.ok / (r.ok + r.bad)) * 100) : 100;
    body = (
      <View style={{ flex: 1 }}>
        <View style={[s.pad, { alignItems: 'center', paddingTop: 60, gap: 16 }]}>
          <Logo size={140} />
          <Rise delay={1400}>
            <Text style={[s.h1, { textAlign: 'center', fontSize: 44, lineHeight: 64, color: C.good }]}>
              {practice ? 'عاشت إيدك' : mode === 'extra' ? 'زدت كلمات جديدة' : 'انفتح'}
            </Text>
          </Rise>
          <Rise delay={1600} style={[s.row, { gap: 8, alignSelf: 'stretch' }]}>
            <Stat n={r.ok} label="صح" color={C.good} />
            <Stat n={r.bad} label="غلط" color={C.bad} />
            <Stat n={acc} suffix="٪" label="دقة" color={C.amber} />
            {!practice && <Stat n={state.streak} label="يوم متتالي" color={C.accent} />}
          </Rise>
          <Rise delay={1800} style={[s.glass, { alignSelf: 'stretch' }]}>
            <Text style={[s.p, { textAlign: 'center' }]}>
              {r.wrongWords.length
                ? `غلطت بـ: ${r.wrongWords.slice(0, 6).join('، ')}. تلكاها بـ«الكلمات الصعبة».`
                : 'ولا غلطة! گول جملة وحدة بصوت عالي بكلمة من اليوم.'}
            </Text>
          </Rise>
          <Rise delay={2000} style={{ alignSelf: 'stretch' }}>
            <GlowButton label="رجوع" onPress={() => setOverlay(null)} />
          </Rise>
        </View>
        <Confetti />
      </View>
    );
  } else {
    const screens: Record<Tab, React.ReactNode> = {
      home: <Home state={state} lockOn={lockOn} onStart={startSession} onMode={startMode} onSettings={() => setTab('settings')} />,
      words: <Library state={state} onFav={(w) => update(toggleFav(state, w))} />,
      stats: <Stats state={state} />,
      settings: (
        <Settings
          state={state}
          perm={perm}
          onPatch={patch}
          onSetTime={onSetTime}
          onToggleLock={onToggleLock}
          onImport={(st) => {
            update(st);
            scheduleReminders(st);
            if (st.lastDone) QuflLock.setDoneDate(st.lastDone);
            QuflLock.setLockTime(st.lockMin);
          }}
        />
      ),
    };
    body = (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{screens[tab]}</View>
        <TabBar
          tab={tab}
          onTab={(x) => {
            if (x === 'settings') refreshPerm();
            setTab(x);
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Background />
      <SafeAreaView style={s.screen}>
        <StatusBar style="light" />
        {body}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Stat({ n, label, color, suffix = '' }: { n: number; label: string; color: string; suffix?: string }) {
  return (
    <View style={[s.glass, { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 0 }]}>
      <Text style={{ color, fontFamily: F.title, fontSize: 24, lineHeight: 34 }}>
        {n}
        {suffix}
      </Text>
      <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 11 }}>{label}</Text>
    </View>
  );
}
