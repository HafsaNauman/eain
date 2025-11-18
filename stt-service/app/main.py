from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech_v1 as speech
from dotenv import load_dotenv
import json
import os
import io
import wave
import uvicorn

# Load environment variables
load_dotenv()

# Set credentials
if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
    credentials_path = os.path.join(os.path.dirname(__file__), '..', 'credentials.json')
    credentials_path = os.path.abspath(credentials_path)
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
    print(f"🔑 Set credentials to: {credentials_path}")

creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
if creds_path and os.path.exists(creds_path):
    print(f" Credentials file found: {creds_path}")
else:
    print(f"Credentials file NOT found at: {creds_path}")

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

def get_wav_info(audio_bytes):
    """Extract sample rate and other info from WAV file"""
    try:
        with wave.open(io.BytesIO(audio_bytes), 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            
            print(f" WAV Info:")
            print(f"   Sample Rate: {sample_rate} Hz")
            print(f"   Channels: {channels}")
            print(f"   Sample Width: {sample_width} bytes")
            
            return sample_rate, channels, sample_width
    except Exception as e:
        print(f" Could not read WAV header: {e}")
        return None, None, None

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    """
    Transcribe audio file using Google Cloud Speech-to-Text API
    """
    try:
        # Read audio file
        audio_content = await file.read()
        
        print(f"\n{'='*60}")
        print(f" Received file: {file.filename}")
        print(f" File size: {len(audio_content)} bytes")
        print(f" Content type: {file.content_type}")
        
        # Parse config
        audio_config = json.loads(config)
        print(f" Requested config: {audio_config}")
        
        # Auto-detect WAV properties if it's a WAV file
        sample_rate = audio_config.get('sampleRateHertz', 44100)
        channels = 1
        
        if file.filename.lower().endswith('.wav'):
            detected_rate, detected_channels, sample_width = get_wav_info(audio_content)
            if detected_rate:
                sample_rate = detected_rate
                channels = detected_channels
                print(f" Using detected sample rate: {sample_rate} Hz")
        
        # Create Google Speech client
        client = speech.SpeechClient()
        
        # Get encoding
        encoding_str = audio_config.get('encoding', 'LINEAR16')
        try:
            encoding = getattr(speech.RecognitionConfig.AudioEncoding, encoding_str)
        except AttributeError:
            print(f" Unknown encoding: {encoding_str}, using LINEAR16")
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
        
        # Configure recognition
        recognition_config = speech.RecognitionConfig(
            encoding=encoding,
            sample_rate_hertz=sample_rate,  # Use detected sample rate
            language_code=audio_config.get('languageCode', 'en-US'),
            enable_automatic_punctuation=True,
            audio_channel_count=channels,
        )
        
        print(f"🎤 Final config: encoding={encoding_str}, sample_rate={sample_rate}, channels={channels}, lang={recognition_config.language_code}")
        
        # Create audio object
        audio = speech.RecognitionAudio(content=audio_content)
        
        # Perform speech recognition
        print(" Sending to Google Speech API...")
        response = client.recognize(
            config=recognition_config,
            audio=audio
        )
        
        print(f"Received response from Google API")
        print(f"   Results count: {len(response.results)}")
        
        # Extract transcript
        transcript = ""
        confidence = 0
        
        if response.results:
            result = response.results[0]
            if result.alternatives:
                alternative = result.alternatives[0]
                transcript = alternative.transcript
                confidence = alternative.confidence if hasattr(alternative, 'confidence') else 0
                
                print(f" Transcript: '{transcript}'")
                print(f" Confidence: {confidence:.2f}")
            else:
                print(" No alternatives in result")
        else:
            print("No results - audio might be:")
            print("   - Silent or too quiet")
            print("   - Too short (< 0.5 seconds)")
            print("   - Poor quality")
        
        print(f"{'='*60}\n")
        
        return {
            "transcript": transcript,
            "confidence": confidence
        }
        
    except Exception as e:
        print(f" Error: {str(e)}")
        print(f" Error type: {type(e).__name__}")
        print(f"{'='*60}\n")
        
        return {
            "error": str(e),
            "transcript": "",
            "confidence": 0
        }

@app.get("/")
async def root():
    return {
        "message": "FastAPI Speech-to-Text service is running",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    creds_exists = os.path.exists(creds_path) if creds_path else False
    
    return {
        "status": "healthy",
        "credentials_loaded": creds_path is not None,
        "credentials_path": creds_path,
        "credentials_exists": creds_exists
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
