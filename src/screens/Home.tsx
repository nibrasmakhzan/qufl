// الرئيسية: التقدم، جلسة اليوم، وطرق الدراسة الإضافية.
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { buzz, C, F, s } from '../theme';
import { dueReviews, formatTime, hardWords, newBatch, State, summary, today, TOTAL } from '../srs';
import { lang } from '../lang';
import Logo from '../fx/Logo';
import Ring from '../fx/Ring';
import Rise from '../fx/Rise';
import GlowButton from '../fx/GlowButton';
import Icon from '../ui/Icon';

export type Mode = 'day' | 'extra' | 'practice' | 'hard' | 'fav';

type Props = {
  state: State;
  lockOn: boolean;
  onStart: () => void;
  onMode: (m: Mode) => void;
  onSettings: () => void;
};

export default function Home({ state, lockOn, onStart, onMode, onSettings }: Props) {
  const { height } = useWindowDimensions();
  const ring = Math.max(110, Math.min(160, height * 0.18));
  const t = today();
  const x = summary(state);
  const doneToday = state.lastDone === t;
  const emergToday = state.emerg.includes(t);
  const reviews = dueReviews(state, t).length;
  const fresh = newBatch(state).length;
  const hard = hardWords(state).length;
  const daysLeft = Math.ceil((TOTAL - x.learned) / state.perDay);

  return (
    <View style={[s.pad, { flex: 1, justifyContent: 'space-between' }]}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={{ alignItems: 'flex-start' }}>
          <Logo size={86} />
          <Text style={{ color: C.accent, fontFamily: F.title, fontSize: 13, letterSpacing: 2, lineHeight: 18 }}>
            {lang.tag}
          </Text>
        </View>
        <View style={[s.glass, s.row, { paddingVertical: 8, paddingHorizontal: 14, gap: 6, borderRadius: 99 }]}>
          <Icon name="fire" size={20} color={state.streak ? C.amber : C.muted} fill={state.streak > 0} />
          <Text style={{ color: C.fg, fontFamily: F.title, fontSize: 20, lineHeight: 28 }}>{state.streak}</Text>
          <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 12 }}>يوم</Text>
        </View>
      </View>

      <Rise delay={120} style={[s.glass, s.row, { paddingVertical: 14, gap: 16 }]}>
        <Ring progress={x.learned / TOTAL} size={ring} stroke={12}>
          <Text style={{ color: C.fg, fontFamily: F.title, fontSize: ring * 0.24, lineHeight: ring * 0.32 }}>
            {x.learned}
          </Text>
          <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 11 }}>من {TOTAL}</Text>
        </Ring>
        <View style={{ flex: 1, gap: 8 }}>
          <Mini label="متقنة" n={x.mastered} color={C.good} />
          <Mini label="دتتعلمها" n={x.learning + x.fresh} color={C.accent} />
          <Mini label="دقة الإجابات" n={x.accuracy} suffix="٪" color={C.amber} />
          <Text style={[s.muted, { fontSize: 11.5 }]}>باقي تقريباً {daysLeft} يوم للقائمة كلها</Text>
        </View>
      </Rise>

      <Rise delay={240} style={[s.glass, { gap: 10 }]}>
        {doneToday ? (
          <>
            <View style={s.row}>
              <Icon name="check" size={22} color={C.good} />
              <Text style={[s.h2, { color: C.good }]}>خلصت جلسة اليوم</Text>
            </View>
            <Text style={s.muted}>
              {reviews > 0 ? `بعد عندك ${reviews} مراجعة مستحقة. ` : ''}تقدر تزيد كلمات أو تتمرّن.
            </Text>
            {fresh > 0 && <GlowButton glow={false} label={`${state.perDay} كلمات زيادة`} onPress={() => onMode('extra')} />}
          </>
        ) : (
          <>
            <Text style={s.h2}>جلسة اليوم</Text>
            <Text style={s.muted}>
              {emergToday
                ? 'استعملت خروج الطوارئ اليوم، فالموبايل مفتوح. تقدر تكمل إذا تحب.'
                : `${fresh} كلمات جديدة + ${reviews} مراجعة${lockOn ? ` · القفل الساعة ${formatTime(state.lockMin)}` : ''}`}
            </Text>
            <GlowButton label="ابدأ" onPress={onStart} />
          </>
        )}
      </Rise>

      <Rise delay={360} style={{ gap: 10 }}>
        <View style={[s.row, { gap: 10 }]}>
          <Action icon="bolt" title="تمرين حر" sub="10 كلمات عشوائية" off={x.learned === 0} onPress={() => onMode('practice')} />
          <Action icon="fire" title="الصعبة" sub={hard ? `${hard} كلمة` : 'ما كو بعد'} off={hard === 0} onPress={() => onMode('hard')} />
          <Action icon="star" title="المفضّلة" sub={`${state.fav.length} كلمة`} off={state.fav.length === 0} onPress={() => onMode('fav')} />
        </View>
        {!lockOn && (
          <Pressable
            onPress={() => {
              buzz.tap();
              onSettings();
            }}
            style={[s.glass, s.row, { paddingVertical: 10, borderColor: 'rgba(250,199,117,0.5)' }]}
          >
            <Icon name="lock" size={20} color={C.amber} />
            <Text style={[s.p, { flex: 1, color: C.amber, fontFamily: F.medium, fontSize: 14 }]}>
              القفل مطفّي. اضغط حتى تفعّله.
            </Text>
          </Pressable>
        )}
      </Rise>
    </View>
  );
}

function Mini({ label, n, color, suffix = '' }: { label: string; n: number; color: string; suffix?: string }) {
  return (
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <Text style={[s.muted, { fontSize: 13 }]}>{label}</Text>
      <Text style={{ color, fontFamily: F.title, fontSize: 18, lineHeight: 24 }}>
        {n}
        {suffix}
      </Text>
    </View>
  );
}

function Action({ icon, title, sub, off, onPress }: {
  icon: string; title: string; sub: string; off: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      disabled={off}
      onPress={() => {
        buzz.tap();
        onPress();
      }}
      style={[s.glass, { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 4, opacity: off ? 0.45 : 1 }]}
    >
      <Icon name={icon} size={22} color={C.accent} />
      <Text style={{ color: C.fg, fontFamily: F.bold, fontSize: 14 }}>{title}</Text>
      <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 11 }} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}
