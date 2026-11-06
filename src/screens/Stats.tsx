// الإحصائيات: الأرقام المهمة، تقويم آخر 5 أسابيع، مستويات الحفظ، والإنجازات.
import { Text, View } from 'react-native';
import { C, F, s } from '../theme';
import { addDays, badges, State, summary, today, TOTAL } from '../srs';
import Rise from '../fx/Rise';
import Icon from '../ui/Icon';

const DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export default function Stats({ state }: { state: State }) {
  const x = summary(state);
  const t = today();
  // 35 يوم تنتهي بنهاية الأسبوع الحالي (السبت)
  const end = addDays(t, 6 - new Date().getDay());
  const cells = Array.from({ length: 35 }, (_, k) => addDays(end, k - 34));
  const maxOk = Math.max(1, ...Object.values(state.log).map((l) => l.ok));
  const bars = [
    { n: x.mastered, color: C.good, label: 'متقنة' },
    { n: x.learning, color: C.accent, label: 'دتتثبّت' },
    { n: x.fresh, color: C.amber, label: 'جديدة' },
  ];
  const list = badges(state);

  return (
    <View style={[s.pad, { flex: 1, gap: 12 }]}>
      <Text style={s.h1}>الإحصائيات</Text>

      <Rise style={[s.row, { gap: 8 }]}>
        <Tile n={state.streak} label="أيام متتالية" color={C.amber} />
        <Tile n={state.best} label="أطول سلسلة" color={C.accent} />
        <Tile n={x.learned} label="كلمة محفوظة" color={C.fg} />
        <Tile n={x.accuracy} suffix="٪" label="دقة" color={C.good} />
      </Rise>

      <Rise delay={100} style={[s.glass, { gap: 10 }]}>
        <Text style={s.h2}>آخر 5 أسابيع</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'space-between' }}>
          {DAYS.map((d) => (
            <Text key={d} style={{ width: '12.4%', textAlign: 'center', color: C.muted, fontFamily: F.medium, fontSize: 11 }}>
              {d}
            </Text>
          ))}
          {cells.map((d) => {
            const l = state.log[d];
            const done = state.lastDone === d || (l && l.ok > 0);
            const future = d > t;
            const a = l ? 0.25 + 0.75 * Math.min(1, l.ok / maxOk) : 0;
            return (
              <View
                key={d}
                style={{
                  width: '12.4%',
                  aspectRatio: 1,
                  borderRadius: 7,
                  backgroundColor: done ? C.accent : 'rgba(255,255,255,0.06)',
                  opacity: future ? 0.25 : done ? a || 1 : 1,
                  borderWidth: d === t ? 1.5 : 0,
                  borderColor: C.fg,
                }}
              />
            );
          })}
        </View>
      </Rise>

      <Rise delay={200} style={[s.glass, { gap: 10 }]}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={s.h2}>مستوى الحفظ</Text>
          <Text style={[s.muted, { fontFamily: F.medium }]}>
            {x.learned} من {TOTAL}
          </Text>
        </View>
        <View style={[s.bar, { height: 14, flexDirection: 'row' }]}>
          {bars.map((b) => (
            <View key={b.label} style={{ flex: b.n, backgroundColor: b.color }} />
          ))}
          <View style={{ flex: Math.max(0, TOTAL - x.learned) }} />
        </View>
        <View style={[s.row, { gap: 14 }]}>
          {bars.map((b) => (
            <View key={b.label} style={[s.row, { gap: 5 }]}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: b.color }} />
              <Text style={[s.muted, { fontSize: 12 }]}>
                {b.label} {b.n}
              </Text>
            </View>
          ))}
        </View>
      </Rise>

      <Rise delay={300} style={[s.glass, { gap: 8, flex: 1 }]}>
        <Text style={s.h2}>الإنجازات</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {list.map((b) => (
            <View
              key={b.id}
              style={{
                width: '31.5%',
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: b.done ? C.accent + '22' : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: b.done ? C.accent : C.glassLine,
                opacity: b.done ? 1 : 0.5,
              }}
            >
              <Icon name={b.done ? 'star' : 'lock'} size={18} color={b.done ? C.amber : C.muted} fill={b.done} />
              <Text style={{ color: C.fg, fontFamily: F.bold, fontSize: 12 }}>{b.title}</Text>
              <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
                {b.desc}
              </Text>
            </View>
          ))}
        </View>
      </Rise>
    </View>
  );
}

function Tile({ n, label, color, suffix = '' }: { n: number; label: string; color: string; suffix?: string }) {
  return (
    <View style={[s.glass, { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 0 }]}>
      <Text style={{ color, fontFamily: F.title, fontSize: 22, lineHeight: 32 }}>
        {n}
        {suffix}
      </Text>
      <Text style={{ color: C.muted, fontFamily: F.body, fontSize: 11 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
