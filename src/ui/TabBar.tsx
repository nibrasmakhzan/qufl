// شريط التنقّل تحت: الرئيسية، الكلمات، الإحصائيات، الإعدادات.
import { Pressable, Text, View } from 'react-native';
import { buzz, C, F } from '../theme';
import Icon from './Icon';

export type Tab = 'home' | 'words' | 'stats' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home' },
  { id: 'words', label: 'الكلمات', icon: 'words' },
  { id: 'stats', label: 'إحصائيات', icon: 'stats' },
  { id: 'settings', label: 'الإعدادات', icon: 'settings' },
];

export default function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 14,
        marginBottom: 8,
        paddingVertical: 6,
        borderRadius: 22,
        backgroundColor: 'rgba(20,24,34,0.92)',
        borderWidth: 1,
        borderColor: C.glassLine,
      }}
    >
      {TABS.map((t) => {
        const on = t.id === tab;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              if (!on) buzz.tap();
              onTab(t.id);
            }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 4, gap: 2 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 14,
                backgroundColor: on ? C.accent + '33' : 'transparent',
              }}
            >
              <Icon name={t.icon} size={21} color={on ? C.accent : C.muted} />
            </View>
            <Text style={{ fontFamily: on ? F.bold : F.medium, fontSize: 11, color: on ? C.fg : C.muted }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
