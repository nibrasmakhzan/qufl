package expo.modules.qufllock

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** الدوال اللي يقدر كود JavaScript يناديها (شوف modules/qufl-lock/index.ts). */
class QuflLockModule : Module() {

  private val ctx: Context
    get() = appContext.reactContext ?: throw IllegalStateException("Android context is not ready")

  override fun definition() = ModuleDefinition {
    Name("QuflLock")

    Function("isAccessibilityEnabled") {
      LockPrefs.isServiceEnabled(ctx)
    }

    Function("canDrawOverlays") {
      Settings.canDrawOverlays(ctx)
    }

    Function("openAccessibilitySettings") {
      open(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    Function("openOverlaySettings") {
      open(
        Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + ctx.packageName)
        )
      )
    }

    Function("openAppSettings") {
      open(
        Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.parse("package:" + ctx.packageName)
        )
      )
    }

    Function("setLockEnabled") { enabled: Boolean ->
      LockPrefs.setEnabled(ctx, enabled)
    }

    Function("setDoneDate") { date: String ->
      LockPrefs.setDoneDate(ctx, date)
    }

    Function("speak") { text: String, lang: String ->
      Audio.stop()
      Tts.speak(ctx, text, lang)
    }

    Function("playAudio") { name: String, rate: Double ->
      Audio.play(ctx, name, rate.toFloat())
    }

    Function("hasAudio") { name: String ->
      Audio.has(ctx, name)
    }

    Function("stopAudio") {
      Audio.stop()
    }

    Function("voiceStatus") { lang: String ->
      Tts.status(ctx, lang)
    }

    Function("installVoice") {
      try {
        ctx.startActivity(Tts.installIntent(ctx))
      } catch (_: Exception) {
        open(Intent("com.android.settings.TTS_SETTINGS"))
      }
    }

    Function("setLockTime") { minutes: Int ->
      LockPrefs.setLockMinute(ctx, minutes)
    }

    Function("getState") {
      mapOf(
        "enabled" to LockPrefs.isEnabled(ctx),
        "doneDate" to LockPrefs.doneDate(ctx),
        "today" to LockPrefs.today(),
        "lockMinute" to LockPrefs.lockMinute(ctx)
      )
    }
  }

  private fun open(intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    ctx.startActivity(intent)
  }
}
