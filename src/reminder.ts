// التذكير اليومي: إشعار بالوقت اللي تختاره.
// نجدول المرتين الجايات بس، ونتخطى اليوم إذا خلّصته، وكل ما تفتح التطبيق نعيد الجدولة.
import * as Notifications from 'expo-notifications';
import { State, today } from './srs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL = 'daily-words';

export async function askPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export async function scheduleReminders(s: State) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.remind) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'تذكير كلمات اليوم',
      importance: Notifications.AndroidImportance.HIGH,
    });
    // التذكير بالدقيقة: أندرويد 13+ يعطي الإذن تلقائياً (USE_EXACT_ALARM)، وبأندرويد 12 نطلبه
    try {
      const exact = await Notifications.getExactAlarmPermissionsAsync();
      if (!exact.granted && exact.canAskAgain) await Notifications.requestExactAlarmPermissionsAsync();
    } catch {}
    const doneToday = s.lastDone === today();
    const now = Date.now();
    for (let day = 0; day < 3; day++) {
      const at = new Date();
      at.setDate(at.getDate() + day);
      at.setHours(Math.floor(s.lockMin / 60), s.lockMin % 60, 0, 0);
      if (at.getTime() <= now) continue;
      if (day === 0 && doneToday) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'قُفل',
          body: 'وصل وقت كلمات اليوم. خلّص العشر كلمات وينفتح الموبايل.',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
      });
    }
  } catch {}
}
