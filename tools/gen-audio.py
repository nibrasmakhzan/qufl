"""يسجّل نطق كل كلمة وجملتها بمحرّك Piper (صوت عصبي مفتوح المصدر)، ويحوّلها لملفات ogg صغيرة.

الاستعمال: python tools/gen-audio.py <lang> <voices-dir>
يكمل من وين وقف: الملفات الموجودة ما يعيدها.
الناتج: langs/<lang>/audio/w<رقم>.ogg (الكلمة) و e<رقم>.ogg (الجملة)
"""
import json
import os
import subprocess
import sys
import tempfile
import time
import wave
from concurrent.futures import ThreadPoolExecutor

from piper import PiperVoice

VOICES = {"tr": "tr_TR-dfki-medium", "es": "es_MX-claude-high", "en": "en_US-lessac-high"}

lang, voices_dir = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
words = json.load(open(f"{root}/langs/{lang}/words.json", encoding="utf-8"))
out = f"{root}/langs/{lang}/audio"
os.makedirs(out, exist_ok=True)
voice = PiperVoice.load(f"{voices_dir}/{VOICES[lang]}.onnx")

try:
    from piper import SynthesisConfig

    cfg_word, cfg_sent = SynthesisConfig(length_scale=1.15), SynthesisConfig(length_scale=1.05)
except ImportError:
    cfg_word = cfg_sent = None


def synth(text, path, cfg):
    with wave.open(path, "wb") as wf:
        if hasattr(voice, "synthesize_wav"):
            voice.synthesize_wav(text, wf, syn_config=cfg)
        else:
            voice.synthesize(text, wf)


def encode(wav, ogg):
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
         "-af", "silenceremove=start_periods=1:start_threshold=-50dB",
         "-c:a", "libopus", "-b:a", "24k", "-ac", "1", ogg],
        check=True,
    )
    os.remove(wav)


tmp = tempfile.mkdtemp(prefix="qufl-")
t0 = time.time()
pool = ThreadPoolExecutor(max_workers=2)
jobs = []
for i, w in enumerate(words):
    for kind, text, cfg in (("w", w["w"], cfg_word), ("e", w["ex"], cfg_sent)):
        ogg = f"{out}/{kind}{i}.ogg"
        if os.path.exists(ogg) and os.path.getsize(ogg) > 0:
            continue
        wav = f"{tmp}/{kind}{i}.wav"
        synth(text, wav, cfg)
        jobs.append(pool.submit(encode, wav, ogg))
    if (i + 1) % 250 == 0:
        print(f"{lang}: {i + 1}/{len(words)} words, {time.time() - t0:.0f}s", flush=True)
for j in jobs:
    j.result()
print(f"DONE {lang}: {len(os.listdir(out))} files in {time.time() - t0:.0f}s", flush=True)
