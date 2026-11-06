// شاشات الترحيب لأول مرة: الفكرة، شلون يشتغل، واختيار هدفك اليومي.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { buzz, C, F, s } from '../theme';
import { GOALS, TOTAL } from '../srs';
import { lang } from '../lang';
import Logo from '../fx/Logo';
import Rise from '../fx/Rise';
import GlowButton from '../fx/GlowButton';
import Icon from '../ui/Icon';

export default function Onboarding({ onDone }: { onDone: (perDay: number) => void }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(10);
  const next = () => {
    buzz.tap();
    setStep(step + 1);
  };

  return (
    <View style={[s.pad, { flex: 1, justifyContent: 'space-between', paddingVertical: 28 }]}>
      <View style={[s.row, { justifyContent: 'center', gap: 6 }]}>
        {[0, 1, 2].map((n) => (
          <View key={n} style={{ width: n === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: n === step ? C.accent : 'rgba(255,255,255,0.18)' }} />
        ))}
      </View>

      {step === 0 && (
        <Rise key="a" style={{ alignItems: 'center', gap: 18 }}>
          <Logo size={170} />
          <Text style={{ color: C.accent, fontFamily: F.title, fontSize: 18, letterSpacing: 3 }}>{lang.tag}</Text>
          <Text style={[s.h1, { textAlign: 'center', fontSize: 30 }]}>تعلّم {lang.nameAr} غصباً عنك</Text>
          <Text style={[s.p, { textAlign: 'center', color: C.muted }]}>
            كل يوم كلمات جديدة من {TOTAL} كلمة هي الأشيع. وبالوقت اللي تختاره، الموبايل ينقفل لحد ما تحفظها.
          </Text>
        </Rise>
      )}

      {step === 1 && (
        <Rise key="b" style={{ gap: 12 }}>
          <Text style={[s.h1, { textAlign: 'center' }]}>شلون يشتغل؟</Text>
          <Point icon="sound" title="اسمع وتعلّم" body="كل كلمة وياها معناها وجملة، ونطق واضح تسمعه عادي أو بطيء." />
          <Point icon="check" title="اختبار 3 مرات" body="الكلمة الجديدة لازم تجاوبها صح 3 مرات: معنى، كتابة، وفراغ بجملة." />
          <Point icon="stats" title="مراجعة بالوقت الصح" body="الكلمة ترجعلك بعد يوم، 3، 7، 14، 30، 60 يوم، حتى ما تنساها." />
          <Point icon="lock" title="قفل لطيف" body="المكالمات والطوارئ تبقى شغالة دائماً، وبيه زر طوارئ مرة بالأسبوع." />
        </Rise>
      )}

      {step === 2 && (
        <Rise key="c" style={{ gap: 16 }}>
          <Text style={[s.h1, { textAlign: 'center' }]}>كم كلمة باليوم؟</Text>
          <Text style={[s.p, { textAlign: 'center', color: C.muted }]}>تقدر تغيّرها بعدين من الإعدادات. 10 كلمات هي الأنسب لأغلب الناس.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {GOALS.map((g) => {
              const on = g === goal;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    buzz.tap();
                    setGoal(g);
                  }}
                  style={[s.glass, { width: '46%', alignItems: 'center', paddingVertical: 16, gap: 2 }, on && { borderColor: C.accent, backgroundColor: C.accent + '22' }]}
                >
                  <Text style={{ color: on ? C.accent : C.fg, fontFamily: F.title, fontSize: 30, lineHeight: 42 }}>{g}</Text>
                  <Text style={[s.muted, { fontSize: 12 }]}>تخلص القائمة بـ {Math.ceil(TOTAL / g)} يوم</Text>
                </Pressable>
              );
            })}
          </View>
        </Rise>
      )}

      <GlowButton
        label={step < 2 ? 'التالي' : 'يلا نبدأ'}
        onPress={() => (step < 2 ? next() : onDone(goal))}
      />
    </View>
  );
}

function Point({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={[s.glass, s.row, { alignItems: 'flex-start', gap: 12 }]}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={C.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.h2, { fontSize: 17, lineHeight: 26 }]}>{title}</Text>
        <Text style={[s.muted, { fontSize: 13 }]}>{body}</Text>
      </View>
    </View>
  );
}
