// الاختبار: معنى، كتابة، فراغ بجملة، واستماع. إذا القفل شغّال، الموبايل يبقى مقفول لحد ما يخلص.
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { buzz, C, F, s } from '../theme';
import { blankSentence, checkTyped, choices, Item, Kind, kindFor, Result, shuffle, words } from '../srs';
import { lang } from '../lang';
import { playWord, stopAudio } from '../voice';
import Ring from '../fx/Ring';
import Rise from '../fx/Rise';
import GlowButton from '../fx/GlowButton';
import Icon from '../ui/Icon';

type Props = {
  items: Item[];
  title: string;
  locked: boolean;
  canEmergency: boolean;
  onDone: (r: Result) => void;
  onEmergency: () => void;
  onQuit: () => void;
};

type Q = { item: Item; kind: Kind; options: number[]; n: number };

const LABEL: Record<Kind, string> = {
  meaning: 'شنو معناها؟',
  type: `اكتبها ب${lang.nameAr}`,
  blank: 'اكتب الكلمة الناقصة بالجملة',
  listen: 'اسمع واختار الكلمة',
};

export default function Quiz({ items, title, locked, canEmergency, onDone, onEmergency, onQuit }: Props) {
  const queue = useRef<Item[]>(shuffle(items));
  const last = useRef<Item | null>(null);
  const count = useRef(0);
  const stats = useRef<Result>({ ok: 0, bad: 0, wrongWords: [] });
  const total = items.reduce((n, x) => n + x.need, 0);
  const shake = useRef(new Animated.Value(0)).current;

  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState<Q | null>(null);
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [kbOpen, setKbOpen] = useState(false);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!locked) onQuit();
      return true;
    });
    const a = Keyboard.addListener('keyboardDidShow', () => setKbOpen(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKbOpen(false));
    return () => {
      back.remove();
      a.remove();
      b.remove();
      stopAudio();
    };
  }, [locked]);

  function next() {
    setFb(null);
    setPicked(null);
    setTyped('');
    const qu = queue.current;
    if (!qu.length) {
      onDone(stats.current);
      return;
    }
    let it = qu.shift()!;
    if (it === last.current && qu.length) {
      qu.push(it);
      it = qu.shift()!;
    }
    last.current = it;
    const kind = kindFor(it);
    count.current++;
    setQ({
      item: it,
      kind,
      options: kind === 'meaning' ? choices(it.idx, 'ar') : kind === 'listen' ? choices(it.idx, 'w') : [],
      n: count.current,
    });
    if (kind === 'meaning' || kind === 'listen') setTimeout(() => playWord(it.idx, words[it.idx].w), 300);
  }

  useEffect(next, []);

  function wobble() {
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 420, easing: Easing.linear, useNativeDriver: true }).start();
  }

  function resolve(ok: boolean) {
    if (!q || fb) return;
    Keyboard.dismiss();
    const it = q.item;
    const w = words[it.idx];
    const qu = queue.current;
    if (ok) {
      buzz.good();
      stats.current.ok++;
      it.got++;
      setCorrect((c) => c + 1);
      setFb({ ok: true, text: `صح  ${w.w}` });
      playWord(it.idx, w.w);
      if (it.got < it.need) {
        const pos = Math.min(qu.length, 2 + Math.floor(Math.random() * Math.max(1, qu.length - 1)));
        qu.splice(pos, 0, it);
      }
      setTimeout(next, 900);
    } else {
      buzz.bad();
      wobble();
      stats.current.bad++;
      if (!stats.current.wrongWords.includes(w.w)) stats.current.wrongWords.push(w.w);
      const lost = it.got;
      it.got = 0;
      it.wrong = true;
      setCorrect((c) => c - lost);
      setFb({ ok: false, text: `الصحيح: ${w.w} = ${w.ar}\n${w.ex}${it.isNew ? '\nعدّاد هالكلمة رجع للصفر.' : ''}` });
      playWord(it.idx, w.w);
      qu.splice(Math.min(2, qu.length), 0, it);
    }
  }

  if (!q) return null;
  const w = words[q.item.idx];
  const blank = q.kind === 'blank' ? blankSentence(w) : null;
  const left = total - correct;
  const shakeX = shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 9, -6, 3, 0] });

  return (
    <View style={[s.pad, { flex: 1, gap: 12 }]}>
      <View style={[s.glass, s.row, { paddingVertical: 10 }]}>
        <Ring progress={correct / total} size={58} stroke={6} from={C.amber} to={C.accent}>
          <Text style={{ color: C.fg, fontFamily: F.title, fontSize: 17, lineHeight: 24 }}>{left}</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={[s.h2, { color: locked ? C.amber : C.accent }]}>{locked ? 'الموبايل مقفول' : title}</Text>
          <Text style={s.muted}>{locked ? `باقي ${left} إجابة صحيحة حتى ينفتح` : `باقي ${left} إجابة صحيحة`}</Text>
        </View>
        {!locked && (
          <Pressable onPress={onQuit} hitSlop={10} style={{ padding: 6 }} accessibilityLabel="خروج">
            <Icon name="close" size={22} color={C.muted} />
          </Pressable>
        )}
      </View>

      <Rise key={q.n} style={{ gap: 12 }}>
        <Text style={[s.muted, { color: C.accent, fontFamily: F.medium }]}>
          {LABEL[q.kind]}
          {q.item.isNew ? '' : '  ·  مراجعة'}
        </Text>

        <Animated.View style={{ gap: 12, transform: [{ translateX: shakeX }] }}>
          {q.kind === 'meaning' || q.kind === 'listen' ? (
            <>
              {q.kind === 'meaning' ? (
                <Pressable onPress={() => playWord(q.item.idx, w.w)}>
                  <Text style={[s.en, { color: C.fg, fontSize: 42, fontFamily: F.latinBold, lineHeight: 60 }]} adjustsFontSizeToFit numberOfLines={1}>
                    {w.w}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => playWord(q.item.idx, w.w)}
                  style={{ alignSelf: 'center', width: 96, height: 96, borderRadius: 48, backgroundColor: C.accent + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent }}
                  accessibilityLabel="اسمع مرة ثانية"
                >
                  <Icon name="sound" size={40} color={C.accent} />
                </Pressable>
              )}
              <View style={{ gap: 9 }}>
                {q.options.map((k) => {
                  const isRight = k === q.item.idx;
                  const show = picked !== null;
                  const good = show && isRight;
                  const bad = show && k === picked && !isRight;
                  return (
                    <Pressable
                      key={k}
                      disabled={show}
                      onPress={() => {
                        setPicked(k);
                        resolve(isRight);
                      }}
                      style={[
                        s.glass,
                        { paddingVertical: 11 },
                        good && { borderColor: C.good, backgroundColor: 'rgba(93,220,154,0.16)' },
                        bad && { borderColor: C.bad, backgroundColor: 'rgba(255,138,115,0.16)' },
                      ]}
                    >
                      {q.kind === 'meaning' ? (
                        <Text style={[s.p, { fontSize: 18, fontFamily: F.medium }]}>{words[k].ar}</Text>
                      ) : (
                        <Text style={[s.en, { color: C.fg, fontSize: 19 }]}>{words[k].w}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={[s.h1, { fontSize: 34, lineHeight: 50 }]}>{w.ar}</Text>
              {blank && (
                <View style={s.glass}>
                  <Text style={[s.en, { color: C.fg, fontSize: 19, lineHeight: 30 }]}>{blank}</Text>
                </View>
              )}
              <Text style={[s.en, { color: C.muted, fontSize: 18, letterSpacing: 4 }]}>{w.w.replace(/[^ ]/g, '_')}</Text>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={!fb}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="visible-password"
                placeholder={lang.placeholder}
                placeholderTextColor={C.muted}
                onSubmitEditing={() => typed.trim() && resolve(checkTyped(typed, w))}
                style={{
                  backgroundColor: C.glass,
                  borderColor: fb ? (fb.ok ? C.good : C.bad) : C.glassLine,
                  borderWidth: 1,
                  borderRadius: 18,
                  color: C.fg,
                  fontSize: 24,
                  fontFamily: F.latin,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  writingDirection: 'ltr',
                  textAlign: 'center',
                }}
              />
              {!fb && <GlowButton glow={false} label="تأكيد" onPress={() => typed.trim() && resolve(checkTyped(typed, w))} />}
            </>
          )}
        </Animated.View>
      </Rise>

      {fb && (
        <Rise
          style={[
            s.glass,
            { borderColor: fb.ok ? C.good : C.bad, backgroundColor: fb.ok ? 'rgba(93,220,154,0.14)' : 'rgba(255,138,115,0.14)' },
          ]}
        >
          <Text style={[s.p, { writingDirection: 'auto' }]}>{fb.text}</Text>
          {!fb.ok && <GlowButton glow={false} label="فهمت، التالي" onPress={next} />}
        </Rise>
      )}

      <View style={{ flex: 1 }} />
      {!kbOpen && locked && <EmergencyButton allowed={canEmergency} onFire={onEmergency} />}
    </View>
  );
}

/** زر الطوارئ: ضغطة 5 ثواني متواصلة، مرة وحدة بالأسبوع. */
function EmergencyButton({ allowed, onFire }: { allowed: boolean; onFire: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  if (!allowed) return <Text style={[s.muted, { textAlign: 'center' }]}>استعملت خروج الطوارئ هالأسبوع.</Text>;
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable
        delayLongPress={5000}
        onLongPress={() => {
          buzz.bad();
          onFire();
        }}
        onPressIn={() => Animated.timing(progress, { toValue: 1, duration: 5000, useNativeDriver: false }).start()}
        onPressOut={() => {
          progress.stopAnimation();
          progress.setValue(0);
        }}
        style={{ borderColor: C.glassLine, borderWidth: 1, borderRadius: 99, overflow: 'hidden', minWidth: 250, backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            start: 0,
            backgroundColor: 'rgba(255,138,115,0.35)',
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
        <Text style={{ color: C.muted, paddingVertical: 10, paddingHorizontal: 18, textAlign: 'center', fontFamily: F.medium }}>
          خروج طوارئ (اضغط مطوّل 5 ثواني)
        </Text>
      </Pressable>
      <Text style={[s.muted, { fontSize: 11, textAlign: 'center' }]}>مرة وحدة بالأسبوع، واليوم ما ينحسب وتنقطع السلسلة</Text>
    </View>
  );
}
