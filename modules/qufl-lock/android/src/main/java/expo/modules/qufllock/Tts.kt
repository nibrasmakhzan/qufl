package expo.modules.qufllock

import android.content.Context
import android.content.Intent
import android.speech.tts.TextToSpeech
import java.util.Locale

/**
 * النطق عن طريق محرّك Google مباشرة.
 *
 * محرّك سامسونگ الافتراضي ما بيه تركي، فكان يقرأ «gece» بالإنكليزي («كيج»).
 * محرّك Google يدعم التركي والإسباني، فنستعمله إذا موجود بالموبايل.
 */
object Tts : TextToSpeech.OnInitListener {
  private const val GOOGLE = "com.google.android.tts"
  private var tts: TextToSpeech? = null
  private var ready = false
  private var pending: Pair<String, String>? = null

  private fun hasGoogle(c: Context): Boolean =
    try {
      c.packageManager.getPackageInfo(GOOGLE, 0)
      true
    } catch (_: Exception) {
      false
    }

  private fun init(c: Context) {
    if (tts != null) return
    val app = c.applicationContext
    tts = if (hasGoogle(app)) TextToSpeech(app, this, GOOGLE) else TextToSpeech(app, this)
  }

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    val p = pending
    pending = null
    if (ready && p != null) say(p.first, p.second)
  }

  private fun say(text: String, lang: String) {
    val t = tts ?: return
    t.language = Locale.forLanguageTag(lang)
    t.setSpeechRate(0.85f)
    t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "qufl")
  }

  fun speak(c: Context, text: String, lang: String) {
    init(c)
    if (!ready) {
      pending = text to lang
      return
    }
    say(text, lang)
  }

  /**
   * حالة صوت اللغة: 0/1/2 = موجود، -1 = يحتاج تنزيل، -2 = اللغة مو مدعومة،
   * -3 = المحرّك بعده يشتغل (اسأل بعد شوية).
   */
  fun status(c: Context, lang: String): Int {
    init(c)
    if (!ready) return -3
    return tts?.isLanguageAvailable(Locale.forLanguageTag(lang)) ?: -2
  }

  /** يفتح شاشة تنزيل الأصوات بمحرّك Google (أو بالمحرّك الافتراضي). */
  fun installIntent(c: Context): Intent {
    val i = Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)
    if (hasGoogle(c)) i.setPackage(GOOGLE)
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return i
  }
}
