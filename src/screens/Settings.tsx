// الإعدادات بثلاث أقسام: الدراسة، القفل، النسخ الاحتياطي.
import { useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import QuflLock from '../../modules/qufl-lock';
import { buzz, C, F, s } from '../theme';
import { formatTime, GOALS, State, today } from '../srs';
import { exportBackup, importBackup } from '../storage';
import { openVoiceSettings } from '../voice';
import { lang } from '../lang';
import GlowButton from '../fx/GlowButton';
import Rise from '../fx/Rise';
import Icon from '../ui/Icon';

type Sec = 'study' | 'lock' | 'backup';

type Props = {
  state: State;
  perm: { overlay: boolean; access: boolean; enabled: boolean };
  onPatch: (p: Partial<State>) => void;
  onSetTime: (min: number) => void;
  onToggleLock: (v: boolean) => void;
  onImport: (s: State) => void;
};

export default function Settings(props: Props) {
  const [sec, setSec] = useState<Sec>(props.perm.enabled && props.perm.access ? 'study' : 'lock');
  const tabs: { id: Sec; label: string }[] = [
    { id: 'study', label: 'الدراسة' },
    { id: 'lock', label: 'القفل' },
    { id: 'backup', label: 'نسخة احتياطية' },
  ];
  return (
    <View style={[s.pad, { flex: 1, gap: 12 }]}>
      <Text style={s.h1}>الإعدادات</Text>
      <View style={[s.glass, s.row, { padding: 4, gap: 4, borderRadius: 16 }]}>
        {tabs.map((t) => {
          const on = t.id === sec;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                buzz.tap();
                setSec(t.id);
              }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: on ? C.accent : 'transparent' }}
            >
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: on ? C.accentFg : C.muted }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {sec === 'study' && <Study {...props} />}
      {sec === 'lock' && <Lock {...props} />}
      {sec === 'backup' && <Backup {...props} />}
    </View>
  );
}

// ---------- الدراسة ----------
function Study({ state, onPatch, onSetTime }: Props) {
  const [m, setM] = useState(state.lockMin);
  const day = 24 * 60;
  const shift = (d: number) => {
    buzz.tap();
    setM((cur) => (((cur + d) % day) + day) % day);
  };
  const changed = m !== state.lockMin || !state.remind;
  return (
    <Rise style={{ gap: 12 }}>
      <View style={[s.glass, { gap: 10 }]}>
        <Text style={s.h2}>كم كلمة جديدة باليوم؟</Text>
        <View style={[s.row, { gap: 8 }]}>
          {GOALS.map((g) => {
            const on = state.perDay === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  buzz.tap();
                  onPatch({ perDay: g });
                }}
                style={[s.chip, { flex: 1, alignItems: 'center' }, on && s.chipOn]}
              >
                <Text style={[s.chipText, { fontSize: 16, fontFamily: F.title }, on && s.chipTextOn]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[s.glass, { gap: 10 }]}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>وقت الكلمات</Text>
            <Text style={[s.muted, { fontSize: 12 }]}>تذكير، وإذا القفل شغّال ينقفل الموبايل من هالوقت</Text>
          </View>
          <Text style={{ color: C.accent, fontFamily: F.title, fontSize: 26, lineHeight: 38 }}>{formatTime(m)}</Text>
        </View>
        <View style={[s.row, { gap: 6 }]}>
          {[
            ['+ ساعة', 60],
            ['− ساعة', -60],
            ['+ 15 د', 15],
            ['− 15 د', -15],
          ].map(([l, d]) => (
            <Pressable key={l as string} onPress={() => shift(d as number)} style={[s.ghost, { flex: 1, paddingVertical: 8 }]}>
              <Text style={[s.ghostText, { color: C.fg }]}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {changed ? (
          <GlowButton glow={false} label={state.remind ? 'احفظ الوقت' : 'شغّل التذكير بهالوقت'} onPress={() => onSetTime(m)} />
        ) : (
          <Text style={[s.muted, { color: C.good, textAlign: 'center' }]}>التذكير شغّال يومياً بهالوقت.</Text>
        )}
      </View>

      <Pressable
        onPress={() => {
          buzz.tap();
          onPatch({ autoPlay: !state.autoPlay });
        }}
        style={[s.glass, s.row]}
      >
        <Icon name="sound" size={20} color={C.accent} />
        <Text style={[s.p, { flex: 1 }]}>نطق الكلمة تلقائياً</Text>
        <Toggle on={state.autoPlay} />
      </Pressable>

      <Pressable onPress={openVoiceSettings} style={[s.glass, s.row]}>
        <Icon name="settings" size={20} color={C.muted} />
        <Text style={[s.p, { flex: 1, fontSize: 14 }]}>إعدادات صوت النطق بالموبايل</Text>
      </Pressable>
    </Rise>
  );
}

// ---------- القفل ----------
function Lock({ perm, state, onToggleLock }: Props) {
  const [confirmOff, setConfirmOff] = useState(false);
  const ready = perm.overlay && perm.access;
  const on = ready && perm.enabled;
  const doneToday = state.lastDone === today();
  return (
    <Rise style={{ gap: 10 }}>
      <Step
        n="1"
        ok={perm.overlay}
        title="العرض فوق التطبيقات"
        body="اضغط الزر ← لكي «قُفل» بالقائمة ← فعّله ← ارجع."
        action="افتح الإعداد"
        onPress={() => QuflLock.openOverlaySettings()}
      />
      <Step
        n="2"
        ok={perm.access}
        title="إمكانية الوصول"
        body={'اضغط الزر ← «التطبيقات المثبّتة» ← «قُفل» ← فعّله.\nإذا ما يتفعّل أو طلع «إعداد مقيّد»: سوّي الخطوة اللي تحت مرة وحدة وارجع جرّب.'}
        action="افتح إمكانية الوصول"
        onPress={() => QuflLock.openAccessibilitySettings()}
        extra={
          !perm.access ? (
            <Pressable
              onPress={() => {
                buzz.tap();
                QuflLock.openAppSettings();
              }}
              style={[s.glass, { paddingVertical: 10, borderColor: C.amber + '88', gap: 2 }]}
            >
              <Text style={[s.muted, { color: C.amber, fontFamily: F.bold }]}>التفعيل ما يصير؟ اضغط هنا</Text>
              <Text style={[s.muted, { fontSize: 12 }]}>ينفتح «معلومات التطبيق» ← النقاط الثلاث ⋮ فوق ← «السماح بالإعدادات المقيّدة» ← أكّد ← ارجع للخطوة 2.</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={[s.glass, { gap: 8, borderColor: on ? C.good + '88' : C.glassLine }]}>
        <Text style={[s.h2, on && { color: C.good }]}>{on ? `القفل شغّال ✓` : '3. شغّل القفل'}</Text>
        {!ready ? (
          <Text style={s.muted}>كمّل الخطوتين فوق أول.</Text>
        ) : on ? (
          <>
            <Text style={s.muted}>ينقفل كل يوم الساعة {formatTime(state.lockMin)} إذا ما خلّصت. المكالمات والطوارئ تبقى شغالة.</Text>
            {confirmOff ? (
              <View style={[s.row, { gap: 8 }]}>
                <Pressable
                  style={[s.ghost, { flex: 1, paddingVertical: 9, borderColor: C.bad }]}
                  onPress={() => {
                    setConfirmOff(false);
                    onToggleLock(false);
                  }}
                >
                  <Text style={[s.ghostText, { color: C.bad }]}>إي، طفّيه</Text>
                </Pressable>
                <Pressable style={[s.ghost, { flex: 1, paddingVertical: 9 }]} onPress={() => setConfirmOff(false)}>
                  <Text style={s.ghostText}>لا، خلّيه</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={[s.ghost, { paddingVertical: 9 }]} onPress={() => setConfirmOff(true)}>
                <Text style={s.ghostText}>{doneToday ? 'طفّي القفل' : 'إلغاء القفل'}</Text>
              </Pressable>
            )}
          </>
        ) : (
          <GlowButton label="شغّل القفل" onPress={() => onToggleLock(true)} />
        )}
      </View>
    </Rise>
  );
}

function Step(p: { n: string; ok: boolean; title: string; body: string; action: string; onPress: () => void; extra?: React.ReactNode }) {
  return (
    <View style={[s.glass, { paddingVertical: p.ok ? 10 : 14, borderColor: p.ok ? C.good + '88' : C.glassLine }]}>
      <Text style={[s.h2, { fontSize: 17, lineHeight: 26 }, p.ok && { color: C.good }]}>
        {p.n}. {p.title} {p.ok ? '✓' : ''}
      </Text>
      {!p.ok && <Text style={[s.muted, { fontSize: 12.5 }]}>{p.body}</Text>}
      {!p.ok && <GlowButton glow={false} label={p.action} onPress={p.onPress} />}
      {p.extra}
    </View>
  );
}

// ---------- النسخ الاحتياطي ----------
function Backup({ state, onImport }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <Rise style={{ gap: 12 }}>
      <View style={[s.glass, { gap: 8 }]}>
        <Text style={s.h2}>احفظ تقدمك</Text>
        <Text style={s.muted}>
          يطلعلك نص بيه كل تقدمك. ابعثه لنفسك بالواتساب أو التليگرام. إذا مسحت التطبيق أو بدّلت موبايلك، تلصقه هنا ويرجع كلشي.
        </Text>
        <GlowButton
          glow={false}
          label="شارك النسخة الاحتياطية"
          onPress={() => Share.share({ message: exportBackup(state), title: `${lang.appName}: نسخة احتياطية` }).catch(() => {})}
        />
      </View>
      <View style={[s.glass, { gap: 8 }]}>
        <Text style={s.h2}>رجّع تقدم محفوظ</Text>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setMsg(null);
            setConfirm(false);
          }}
          placeholder="الصق النص هنا"
          placeholderTextColor={C.muted}
          multiline
          style={{ minHeight: 70, maxHeight: 90, color: C.fg, fontFamily: F.latin, fontSize: 12, borderWidth: 1, borderColor: C.glassLine, borderRadius: 12, padding: 10, textAlignVertical: 'top' }}
        />
        {msg && <Text style={[s.muted, { color: msg.ok ? C.good : C.bad }]}>{msg.t}</Text>}
        {confirm ? (
          <View style={[s.row, { gap: 8 }]}>
            <Pressable
              style={[s.ghost, { flex: 1, borderColor: C.bad }]}
              onPress={() => {
                const r = importBackup(text);
                if (r.state) {
                  onImport(r.state);
                  setMsg({ ok: true, t: 'رجع التقدم.' });
                  setText('');
                } else setMsg({ ok: false, t: r.error! });
                setConfirm(false);
              }}
            >
              <Text style={[s.ghostText, { color: C.bad }]}>إي، بدّل التقدم الحالي</Text>
            </Pressable>
            <Pressable style={[s.ghost, { flex: 1 }]} onPress={() => setConfirm(false)}>
              <Text style={s.ghostText}>لا</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[s.ghost, !text.trim() && { opacity: 0.4 }]}
            disabled={!text.trim()}
            onPress={() => {
              const r = importBackup(text);
              if (r.error) setMsg({ ok: false, t: r.error });
              else setConfirm(true);
            }}
          >
            <Text style={[s.ghostText, { color: C.fg }]}>رجّع</Text>
          </Pressable>
        )}
      </View>
      <Text style={[s.muted, { textAlign: 'center', fontSize: 11 }]}>{lang.appName} · النسخة 2.0</Text>
    </Rise>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: on ? C.accent : 'rgba(255,255,255,0.15)', padding: 3, alignItems: on ? 'flex-end' : 'flex-start' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.fg }} />
    </View>
  );
}
