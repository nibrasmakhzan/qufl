package expo.modules.qufllock

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.telecom.TelecomManager
import android.view.accessibility.AccessibilityEvent
import android.view.inputmethod.InputMethodManager

/**
 * خدمة إمكانية الوصول اللي تقفل الموبايل.
 *
 * كل ما ينفتح تطبيق، النظام يخبرنا باسم حزمته (package). إذا القفل شغّال
 * والتطبيق مو من المسموحين، نرجّع تطبيق قُفل للواجهة.
 *
 * المسموح دائماً: قُفل نفسه، تطبيق الاتصال وشاشة المكالمة، الطوارئ،
 * جهات الاتصال، الكيبورد، وواجهة النظام (الإشعارات وقائمة زر التشغيل).
 */
class LockService : AccessibilityService() {

  private var lastLaunch = 0L

  private val alwaysAllowed = setOf(
    "android",                 // نوافذ النظام مثل قائمة إطفاء الموبايل
    "com.android.systemui",    // شريط الإشعارات وشاشة القفل الأصلية
    "com.android.phone",
    "com.android.server.telecom"
  )

  // أي حزمة اسمها يحتوي هذه الكلمات تعتبر اتصال/طوارئ وتبقى مفتوحة
  private val allowedKeywords = listOf(
    "dialer", "incallui", "telecom", "emergency", "safetyhub", "sos", "contacts", "callui"
  )

  override fun onServiceConnected() {
    super.onServiceConnected()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (!LockPrefs.isLocked(this)) return
    if (isAllowed(pkg)) return

    // حتى ما نفتح التطبيق عشرين مرة بالثانية
    val now = SystemClock.elapsedRealtime()
    if (now - lastLaunch < 700) return
    lastLaunch = now

    bringAppToFront()
  }

  override fun onInterrupt() {}

  private fun isAllowed(pkg: String): Boolean {
    if (pkg == packageName) return true
    // تطبيقات قُفل الثانية (مثل قُفل تركي): حتى لو الاثنين مقفولين ما يتعاركون على الشاشة
    if (pkg.startsWith("com.qufl.")) return true
    if (pkg in alwaysAllowed) return true
    val lower = pkg.lowercase()
    if (allowedKeywords.any { lower.contains(it) }) return true
    if (pkg in dialerPackages()) return true
    if (pkg in keyboardPackages()) return true
    return false
  }

  private fun dialerPackages(): Set<String> {
    val out = mutableSetOf<String>()
    try {
      val tm = getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
      tm?.defaultDialerPackage?.let { out.add(it) }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        tm?.systemDialerPackage?.let { out.add(it) }
      }
    } catch (_: Exception) {
    }
    return out
  }

  private fun keyboardPackages(): Set<String> {
    val out = mutableSetOf<String>()
    try {
      val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
      imm?.enabledInputMethodList?.forEach { out.add(it.packageName) }
      Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
        ?.substringBefore('/')
        ?.let { if (it.isNotEmpty()) out.add(it) }
    } catch (_: Exception) {
    }
    return out
  }

  private fun bringAppToFront() {
    val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
    intent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
        Intent.FLAG_ACTIVITY_SINGLE_TOP
    )
    try {
      startActivity(intent)
    } catch (_: Exception) {
    }
  }
}
