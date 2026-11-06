// تعلّم كلمات اليوم: كلمة وحدة بالشاشة، نطق واضح، «أعرفها» للكلمات اللي تعرفها، ونجمة للمفضّلة.
import { useEffect, useRef, useState } from 'react';
import { AppState, PanResponder, Pressable, Text, View } from 'react-native';
import { buzz, C, F, s } from '../theme';
import { words } from '../srs';
import { hasVoice, openVoiceSettings, playSentence, playWord, stopAudio } from '../voice';
import Rise from '../fx/Rise';
import GlowButton from '../fx/GlowButton';
import Icon from '../ui/Icon';

type Props = {
  batch: number[];
  reviews: number;
  autoPlay: boolean;
  fav: string[];
  onKnown: (idx: number) => void;
  onFav: (word: string) => void;
  onReady: () => void;
};

export default function Learn({ batch, reviews, autoPlay, fav, onKnown, onFav, onReady }: Props) {
  const [i, setI] = useState(0);
  const [noVoice, setNoVoice] = useState(false);
  const cur = Math.min(i, batch.length - 1);
  const idx = batch[cur];
  const w = words[idx];
  const last = cur === batch.length - 1;

  useEffect(() => {
    const check = () => hasVoice().then((ok) => setNoVoice(!ok));
    check();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && check());
    return () => {
      sub.remove();
      stopAudio();
    };
  }, []);

  // نطق تلقائي لما تظهر الكلمة
  useEffect(() => {
    if (autoPlay && w) {
      const t = setTimeout(() => playWord(idx, w.w), 350);
      return () => clearTimeout(t);
    }
  }, [idx]);

  const go = (d: number) =>
    setI((c) => {
      const n = Math.max(0, Math.min(batch.length - 1, c + d));
      if (n !== c) buzz.tap();
      return n;
    });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) go(1);
        else if (g.dx > 50) go(-1);
      },
    })
  ).current;

  if (!w) return null;
  const starred = fav.includes(w.w);

  return (
    <View style={[s.pad, { flex: 1 }]}>
      <Rise>
        <Text style={s.h1}>كلمات اليوم</Text>
        <Text style={s.muted}>
          اسمع الكلمة وكرّرها بصوت عالي. إذا تعرفها من قبل اضغط «أعرفها» وتنشال من اليوم. بعدها الاختبار
          {reviews > 0 ? ` (ومعها ${reviews} مراجعة)` : ''}.
        </Text>
      </Rise>

      {noVoice && (
        <Pressable onPress={openVoiceSettings} style={[s.glass, { paddingVertical: 10, borderColor: C.amber, gap: 2 }]}>
          <Text style={[s.muted, { color: C.amber, fontFamily: F.medium }]}>صوت اللغة مو منزّل بموبايلك، فالنطق ممكن يطلع غلط.</Text>
          <Text style={[s.muted, { fontSize: 12 }]}>اضغط هنا ← نزّل الصوت من خدمات Google للنطق ← وارجع.</Text>
        </Pressable>
      )}

      <View style={{ flex: 1, justifyContent: 'center' }} {...pan.panHandlers}>
        <Rise key={w.w} style={[s.glass, { paddingVertical: 24, gap: 12, alignItems: 'center' }]}>
          <View style={[s.row, { alignSelf: 'stretch', justifyContent: 'space-between' }]}>
            <Text style={{ color: C.muted, fontFamily: F.medium, fontSize: 13 }}>
              {cur + 1} من {batch.length}
            </Text>
            <Pressable
              onPress={() => {
                buzz.tap();
                onFav(w.w);
              }}
              hitSlop={12}
              accessibilityLabel={starred ? 'شيلها من المفضّلة' : 'ضيفها للمفضّلة'}
            >
              <Icon name="star" size={24} color={starred ? C.amber : C.muted} fill={starred} />
            </Pressable>
          </View>

          <Pressable onPress={() => playWord(idx, w.w)}>
            <Text style={[s.en, { color: C.fg, fontSize: 42, fontFamily: F.latinBold, lineHeight: 58 }]} adjustsFontSizeToFit numberOfLines={1}>
              {w.w}
            </Text>
          </Pressable>
          <Text style={[s.p, { color: C.accent, fontFamily: F.bold, fontSize: 22, lineHeight: 34, textAlign: 'center' }]}>{w.ar}</Text>
          <Pressable onPress={() => playSentence(idx, w.ex)}>
            <Text style={[s.en, { color: C.fg, fontSize: 18, lineHeight: 28, opacity: 0.85 }]}>{w.ex}</Text>
          </Pressable>

          <View style={[s.row, { gap: 8, marginTop: 4 }]}>
            <Sound label="الكلمة" icon="sound" onPress={() => playWord(idx, w.w)} />
            <Sound label="الجملة" icon="sound" onPress={() => playSentence(idx, w.ex)} />
            <Sound label="بطيء" icon="slow" onPress={() => playWord(idx, w.w, 0.7)} />
          </View>
        </Rise>

        <View style={[s.row, { justifyContent: 'center', gap: 6, marginTop: 14 }]}>
          {batch.map((_, n) => (
            <View
              key={n}
              style={{ width: n === cur ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: n === cur ? C.accent : 'rgba(255,255,255,0.18)' }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {last ? (
          <GlowButton label="حفظتها، ابدأ الاختبار" onPress={onReady} />
        ) : (
          <GlowButton glow={false} label="الكلمة الجاية" onPress={() => go(1)} />
        )}
        <View style={[s.row, { gap: 10 }]}>
          <Pressable style={[s.ghost, { flex: 1 }, cur === 0 && { opacity: 0.4 }]} disabled={cur === 0} onPress={() => go(-1)}>
            <Text style={s.ghostText}>السابقة</Text>
          </Pressable>
          <Pressable
            style={[s.ghost, { flex: 1, borderColor: C.good + '88' }]}
            onPress={() => {
              buzz.good();
              onKnown(idx);
              if (cur > 0 && last) setI(cur - 1);
            }}
          >
            <Text style={[s.ghostText, { color: C.good }]}>أعرفها ✓</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Sound({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        buzz.tap();
        onPress();
      }}
      style={[s.row, { gap: 6, borderColor: C.glassLine, borderWidth: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.glassStrong }]}
    >
      <Icon name={icon} size={18} color={C.fg} />
      <Text style={{ color: C.fg, fontSize: 13, fontFamily: F.medium }}>{label}</Text>
    </Pressable>
  );
}
