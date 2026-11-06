package expo.modules.qufllock

import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * حالة القفل محفوظة بالموبايل نفسه (SharedPreferences) حتى خدمة إمكانية الوصول
 * تقدر تقراها حتى لو التطبيق مسدود.
 *
 * القفل شغّال إذا: المستخدم فعّله + تاريخ آخر يوم خلّصه مو اليوم.
 */
object LockPrefs {
  private const val FILE = "qufl_lock"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_DONE = "doneDate"
  private const val KEY_TIME = "lockMinute"

  private fun prefs(c: Context): SharedPreferences =
    c.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  /** تاريخ اليوم بصيغة 2026-11-05 وبأرقام إنكليزية، نفس صيغة JavaScript. */
  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  fun isEnabled(c: Context): Boolean = prefs(c).getBoolean(KEY_ENABLED, false)

  fun setEnabled(c: Context, value: Boolean) {
    prefs(c).edit().putBoolean(KEY_ENABLED, value).apply()
  }

  fun doneDate(c: Context): String = prefs(c).getString(KEY_DONE, "") ?: ""

  fun setDoneDate(c: Context, date: String) {
    prefs(c).edit().putString(KEY_DONE, date).apply()
  }

  /** وقت بداية القفل كل يوم، بالدقائق من نص الليل (0 = من أول اليوم). */
  fun lockMinute(c: Context): Int = prefs(c).getInt(KEY_TIME, 0)

  fun setLockMinute(c: Context, minutes: Int) {
    prefs(c).edit().putInt(KEY_TIME, minutes.coerceIn(0, 24 * 60 - 1)).apply()
  }

  private fun nowMinute(): Int {
    val cal = Calendar.getInstance()
    return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
  }

  /** مقفول إذا: القفل مفعّل + ما خلصت اليوم + وصل وقت القفل. */
  fun isLocked(c: Context): Boolean =
    isEnabled(c) && doneDate(c) != today() && nowMinute() >= lockMinute(c)

  /** هل المستخدم فعّل خدمة إمكانية الوصول مال قُفل من الإعدادات؟ */
  fun isServiceEnabled(c: Context): Boolean {
    val list = Settings.Secure.getString(
      c.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false
    val me = ComponentName(c, LockService::class.java)
    return list.split(':').any { ComponentName.unflattenFromString(it) == me }
  }
}
