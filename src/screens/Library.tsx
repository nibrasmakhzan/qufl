// قاموس الكلمات: بحث، فلاتر (المحفوظة، المتقنة، الصعبة، المفضّلة، كل القائمة)، وصفحات بدون سكرول.
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { buzz, C, F, s } from '../theme';
import { MASTER_BOX, State, words } from '../srs';
import { playSentence, playWord } from '../voice';
import Icon from '../ui/Icon';

type Filter = 'learned' | 'mastered' | 'hard' | 'fav' | 'all';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'learned', label: 'المحفوظة' },
  { id: 'mastered', label: 'المتقنة' },
  { id: 'hard', label: 'الصعبة' },
  { id: 'fav', label: 'المفضّلة' },
  { id: 'all', label: 'كل القائمة' },
];

const fold = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

export default function Library({ state, onFav }: { state: State; onFav: (w: string) => void }) {
  const { height } = useWindowDimensions();
  const per = Math.max(4, Math.floor((height - 330) / 62));
  const [filter, setFilter] = useState<Filter>('learned');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  const list = useMemo(() => {
    const fq = fold(q.trim());
    const out: number[] = [];
    words.forEach((w, i) => {
      const c = state.cards[w.w];
      const keep =
        filter === 'all' ||
        (filter === 'learned' && c) ||
        (filter === 'mastered' && c && c.box >= MASTER_BOX) ||
        (filter === 'hard' && c && (state.wrong[w.w] ?? 0) > 0) ||
        (filter === 'fav' && state.fav.includes(w.w));
      if (!keep) return;
      if (fq && !fold(w.w).includes(fq) && !w.ar.includes(q.trim())) return;
      out.push(i);
    });
    if (filter === 'hard') out.sort((a, b) => (state.wrong[words[b].w] ?? 0) - (state.wrong[words[a].w] ?? 0));
    return out;
  }, [filter, q, state]);

  const pages = Math.max(1, Math.ceil(list.length / per));
  const p = Math.min(page, pages - 1);
  const shown = list.slice(p * per, p * per + per);

  return (
    <View style={[s.pad, { flex: 1, gap: 10 }]}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Text style={s.h1}>الكلمات</Text>
        <Text style={[s.muted, { fontFamily: F.medium }]}>{list.length} كلمة</Text>
      </View>

      <View style={[s.glass, s.row, { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 16 }]}>
        <Icon name="search" size={18} color={C.muted} />
        <TextInput
          value={q}
          onChangeText={(t) => {
            setQ(t);
            setPage(0);
          }}
          placeholder="دوّر بالكلمة أو بمعناها"
          placeholderTextColor={C.muted}
          autoCorrect={false}
          autoCapitalize="none"
          style={{ flex: 1, color: C.fg, fontFamily: F.body, fontSize: 15, paddingVertical: 8, textAlign: 'right' }}
        />
      </View>

      <View style={[s.row, { flexWrap: 'wrap', gap: 6 }]}>
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                buzz.tap();
                setFilter(f.id);
                setPage(0);
                setOpen(null);
              }}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1, gap: 6 }}>
        {shown.length === 0 ? (
          <View style={[s.glass, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={[s.p, { textAlign: 'center' }]}>
              {q ? 'ما لكيت كلمة بهالبحث.' : filter === 'learned' ? 'بعدك ما حفظت كلمات. ابدأ جلسة اليوم من الرئيسية.' : 'ما كو كلمات هنا بعد.'}
            </Text>
          </View>
        ) : (
          shown.map((i) => {
            const w = words[i];
            const c = state.cards[w.w];
            const isOpen = open === i;
            const star = state.fav.includes(w.w);
            return (
              <Pressable
                key={i}
                onPress={() => {
                  setOpen(isOpen ? null : i);
                  if (!isOpen) playWord(i, w.w);
                }}
                style={[s.glass, { paddingVertical: 9, paddingHorizontal: 14, gap: 4, borderRadius: 16 }]}
              >
                <View style={s.row}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: !c ? 'rgba(255,255,255,0.18)' : c.box >= MASTER_BOX ? C.good : C.accent,
                    }}
                  />
                  <Text style={[s.p, { flex: 1, fontSize: 15 }]} numberOfLines={1}>
                    {w.ar}
                  </Text>
                  <Text style={[s.en, { color: C.fg, fontSize: 17, fontFamily: F.latinBold }]}>{w.w}</Text>
                  <Pressable onPress={() => onFav(w.w)} hitSlop={10}>
                    <Icon name="star" size={19} color={star ? C.amber : C.muted} fill={star} />
                  </Pressable>
                </View>
                {isOpen && (
                  <Pressable onPress={() => playSentence(i, w.ex)} style={[s.row, { gap: 8, paddingTop: 4 }]}>
                    <Icon name="sound" size={16} color={C.accent} />
                    <Text style={[s.en, { flex: 1, color: C.muted, fontSize: 15, textAlign: 'right' }]}>{w.ex}</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })
        )}
      </View>

      {pages > 1 && (
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Pressable style={[s.ghost, { paddingHorizontal: 18, paddingVertical: 8 }, p === 0 && { opacity: 0.4 }]} disabled={p === 0} onPress={() => setPage(p - 1)}>
            <Icon name="chevR" size={18} color={C.fg} />
          </Pressable>
          <Text style={[s.muted, { fontFamily: F.medium }]}>
            صفحة {p + 1} من {pages}
          </Text>
          <Pressable style={[s.ghost, { paddingHorizontal: 18, paddingVertical: 8 }, p >= pages - 1 && { opacity: 0.4 }]} disabled={p >= pages - 1} onPress={() => setPage(p + 1)}>
            <Icon name="chevL" size={18} color={C.fg} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
