from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
#from google.cloud import speech_v1 as speech
from dotenv import load_dotenv
import json
import os
import io
import wave
import uvicorn
import subprocess
import tempfile
import struct
import math

# Load environment variables
load_dotenv()

# Set credentials
if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
    credentials_path = os.path.join(os.path.dirname(__file__), '..', 'credentials.json')
    credentials_path = os.path.abspath(credentials_path)
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
    print(f"🔑 Set credentials to: {credentials_path}")

creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
print(
    f" Credentials file found: {creds_path}"
    if creds_path and os.path.exists(creds_path)
    else f" Credentials file NOT found: {creds_path}"
)

app = FastAPI(
    title="Speech-to-Text Service",
    description="Google Cloud Speech-to-Text API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# WAV INFO EXTRACTOR
# -----------------------------
def get_wav_info(audio_bytes):
    try:
        with wave.open(io.BytesIO(audio_bytes), 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()

            print("\n🔍 WAV Info:")
            print(f"   Sample Rate: {sample_rate} Hz")
            print(f"   Channels:    {channels}")
            print(f"   Sample Width:{sample_width} bytes")

            return sample_rate, channels, sample_width
    except Exception as e:
        print(f"⚠ Could not read WAV header: {e}")
        return None, None, None


# -----------------------------
# AUDIO CONVERSION (FFmpeg)
# -----------------------------
# def convert_to_linear16(audio_bytes):
#     """
#     Ensures the format is 16-bit PCM, mono, 44.1kHz.
#     """
#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as input_file:
#             input_file.write(audio_bytes)
#             input_path = input_file.name

#         output_path = input_path.replace(".wav", "_fixed.wav")

#         subprocess.run([
#             "ffmpeg", "-y",
#             "-i", input_path,
#             "-ac", "1",
#             "-ar", "44100",
#             "-sample_fmt", "s16",
#             output_path
#         ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

#         with open(output_path, "rb") as f:
#             return f.read()

#     except Exception as e:
#         print(f"⚠ FFmpeg conversion failed or unavailable: {e}")
#         return audio_bytes

def convert_to_linear16(audio_bytes):
    """
    Ensures the format is 16-bit PCM, mono, 44.1kHz using FFmpeg.
    """
    try:
        import subprocess
        import tempfile
        import os
        
        # Check if FFmpeg is available
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ FFmpeg not found! Please install FFmpeg:")
            print("   Windows: choco install ffmpeg")
            print("   Mac: brew install ffmpeg")
            print("   Linux: sudo apt install ffmpeg")
            return audio_bytes  # Return original if FFmpeg unavailable

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as input_file:
            input_file.write(audio_bytes)
            input_path = input_file.name

        output_path = input_path.replace(".wav", "_fixed.wav")

        # FFmpeg conversion with error handling
        result = subprocess.run([
            "ffmpeg", "-y",
            "-i", input_path,
            "-ac", "1",           # Mono
            "-ar", "44100",       # 44.1kHz
            "-acodec", "pcm_s16le",  # 16-bit PCM
            "-f", "wav",          # Force WAV format
            output_path
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if result.returncode != 0:
            error_msg = result.stderr.decode('utf-8', errors='ignore')
            print(f"❌ FFmpeg conversion failed: {error_msg}")
            # Clean up
            if os.path.exists(input_path):
                os.remove(input_path)
            return audio_bytes

        # Read converted file
        with open(output_path, "rb") as f:
            converted_audio = f.read()

        # Clean up temp files
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)

        print(f"✅ FFmpeg conversion successful: {len(converted_audio)} bytes")
        return converted_audio

    except Exception as e:
        print(f"⚠️ FFmpeg conversion error: {e}")
        return audio_bytes



# -----------------------------
# PYTHON 3.13 RMS (NO audioop)
# -----------------------------
def is_audio_too_quiet(audio_bytes, sample_width=2):
    """
    Computes RMS volume manually (Python 3.13-ready).
    Works only for 16-bit PCM.
    """
    if sample_width != 2:
        return False

    try:
        count = len(audio_bytes) // 2
        if count == 0:
            return True

        # Signed 16-bit little endian
        samples = struct.unpack("<" + "h" * count, audio_bytes)

        sum_squares = sum(s * s for s in samples)
        rms = math.sqrt(sum_squares / count)

        print(f"🔊 RMS Volume: {rms:.2f}")

        return rms < 500   # threshold
    except Exception as e:
        print(f"RMS calculation failed: {e}")
        return False


# -----------------------------
# TRANSCRIBE ROUTE
# -----------------------------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), config: str = Form(...)):
    from google.cloud import speech_v1 as speech  # ✅ moved here
    audio_content = await file.read()

    print("\n" + "=" * 60)
    print(f"📥 Received file: {file.filename}")
    print(f"📏 Size: {len(audio_content)} bytes")
    print(f"🧪 Type: {file.content_type}")

    audio_config = json.loads(config)
    print(f"⚙ Requested config: {audio_config}")

    # Get WAV info
    detected_rate, detected_channels, sample_width = get_wav_info(audio_content)

    # Soft warning — NOT rejection
    if detected_rate:
        duration_sec = len(audio_content) / (
            detected_rate * max(detected_channels, 1) * max(sample_width, 1)
        )
        print(f"⏱ Estimated Duration: {duration_sec:.3f} sec")
        if duration_sec < 0.45:
            print("⚠ Short audio — may reduce accuracy.")

    # Quiet warning
    if is_audio_too_quiet(audio_content, sample_width or 2):
        print("⚠ Audio is very quiet — STT may fail.")

    # ✅ Always convert — handles non-RIFF, m4a, webm from mobile
    if sample_width is None or sample_width not in [1, 2]:
        print("⚠ Invalid/non-RIFF audio detected. Converting with FFmpeg...")
        audio_content = convert_to_linear16(audio_content)
        detected_rate, detected_channels, sample_width = get_wav_info(audio_content)
        if detected_rate is None:
            print("❌ Conversion failed — audio unreadable")
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Invalid audio format. Please record again.")

    # Set encoding
    encoding_str = audio_config.get("encoding", "LINEAR16")
    try:
        encoding = getattr(speech.RecognitionConfig.AudioEncoding, encoding_str)
    except:
        print("⚠ Invalid encoding, using LINEAR16")
        encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16

    sample_rate = detected_rate or audio_config.get("sampleRateHertz", 44100)
    channels = detected_channels or 1

    # # Google config
    # recognition_config = speech.RecognitionConfig(
    #     encoding=encoding,
    #     sample_rate_hertz=sample_rate,
    #     language_code=audio_config.get("languageCode", "en-US"),
    #     enable_automatic_punctuation=True,
    #     audio_channel_count=channels,
    # )

    
    # OPTIMIZED — bilingual + phrase hints + best model
    primary_lang = audio_config.get("languageCode", "ur-PK")
    alt_langs     = audio_config.get("alternativeLanguageCodes", ["en-US"])
    use_enhanced  = audio_config.get("useEnhanced", True)
    model         = audio_config.get("model", "latest_long")

    # Build speech contexts (phrase hints) from config
    # ✅ CORRECT — phrases are plain strings, boost is on SpeechContext not Phrase
    speech_contexts = []
    raw_contexts = audio_config.get("speechContexts", [])
    for ctx in raw_contexts:
        phrase_strings = [
            p["value"] if isinstance(p, dict) else p
            for p in ctx.get("phrases", [])
        ]
        if phrase_strings:
            speech_contexts.append(
                speech.SpeechContext(
                    phrases=phrase_strings,
                    boost=15.0
                )
            )
    recognition_config = speech.RecognitionConfig(
        encoding=encoding,
        sample_rate_hertz=sample_rate,
        language_code=primary_lang,
        alternative_language_codes=alt_langs,     # ← handles Urdu+English code-switching
        model=model,                               # ← latest_long > default for Urdu
        use_enhanced=use_enhanced,                 # ← enhanced model
        enable_automatic_punctuation=True,
        audio_channel_count=channels,
        speech_contexts=speech_contexts,           # ← fashion phrase hints
    )

    print(
        f"🎤 Final Config → encoding={encoding_str}, "
        f"sample_rate={sample_rate}, channels={channels}, "
        f"lang={primary_lang} + alt={alt_langs}, model={model}"
    )

    print(
        f"🎤 Final Config → encoding={encoding_str}, "
        f"sample_rate={sample_rate}, channels={channels}, lang={recognition_config.language_code}"
    )
    print(f"🔍 Extracted Language Code: {recognition_config.language_code}") # DEBUG LOG

    client = speech.SpeechClient()

    print("📡 Sending to Google...")
    response = client.recognize(
        config=recognition_config,
        audio=speech.RecognitionAudio(content=audio_content)
    )

    print("📨 Google Response Received")
    print(f"   Results count: {len(response.results)}")

    if not response.results:
        print("⚠ No transcription returned.")
        return {"transcript": "", "confidence": 0}

    best = response.results[0].alternatives[0]

    print(f"📝 Transcript: {best.transcript}")
    print(f"🎯 Confidence: {best.confidence:.2f}")
    print("=" * 60)

    return {
        "transcript": best.transcript,
        "confidence": best.confidence
    }


@app.get("/")
async def root():
    return {
        "message": "FastAPI Speech-to-Text service is running",
        "status": "healthy"
    }


@app.get("/health")
async def health():
    creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    return {
        "status": "healthy",
        "credentials_loaded": creds is not None,
        "credentials_path": creds,
        "credentials_exists": os.path.exists(creds) if creds else False
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
