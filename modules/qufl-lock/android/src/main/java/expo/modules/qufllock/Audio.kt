package expo.modules.qufllock

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build

/**
 * تشغيل النطق المسجّل مسبقاً (ملفات ogg داخل التطبيق، مجلد assets/audio).
 * هذا النطق مصنوع بمحرّك عصبي ونطقه أدق بكثير من محرّك الموبايل.
 * إذا الملف مو موجود أو الموبايل ما يقدر يشغّله، يرجّع false والتطبيق يستعمل محرّك النطق العادي.
 */
object Audio {
  private var player: MediaPlayer? = null

  fun stop() {
    try {
      player?.stop()
    } catch (_: Exception) {
    }
    player?.release()
    player = null
  }

  fun has(c: Context, name: String): Boolean =
    try {
      c.assets.openFd("audio/$name").close()
      true
    } catch (_: Exception) {
      false
    }

  fun play(c: Context, name: String, rate: Float): Boolean {
    stop()
    return try {
      val fd = c.assets.openFd("audio/$name")
      val mp = MediaPlayer()
      mp.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build()
      )
      mp.setDataSource(fd.fileDescriptor, fd.startOffset, fd.length)
      fd.close()
      mp.prepare()
      if (rate != 1f && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        mp.playbackParams = PlaybackParams().setSpeed(rate)
      }
      mp.setOnCompletionListener { stop() }
      mp.start()
      player = mp
      true
    } catch (_: Exception) {
      stop()
      false
    }
  }
}
