# main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech_v1 as speech
from dotenv import load_dotenv
import json
import os
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Speech-to-Text Service",
    description="Google Cloud Speech-to-Text API",
    version="1.0.0"
)

# Enable CORS for Node.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Node.js backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    """
    Transcribe audio file using Google Cloud Speech-to-Text API
    
    Args:
        file: Audio file (WAV, MP3, etc.)
        config: JSON string with encoding, sampleRateHertz, languageCode
    
    Returns:
        {
            "transcript": "transcribed text",
            "confidence": 0.95
        }
    """
    try:
        # Read audio file
        audio_content = await file.read()
        
        # Parse config
        audio_config = json.loads(config)
        
        # Create Google Speech client
        client = speech.SpeechClient()
        
        # Configure recognition
        recognition_config = speech.RecognitionConfig(
            encoding=getattr(
                speech.RecognitionConfig.AudioEncoding,
                audio_config.get('encoding', 'LINEAR16')
            ),
            sample_rate_hertz=audio_config.get('sampleRateHertz', 44100),
            language_code=audio_config.get('languageCode', 'en-US'),
        )
        
        # Create audio object
        audio = speech.RecognitionAudio(content=audio_content)
        
        # Perform speech recognition
        response = client.recognize(
            config=recognition_config,
            audio=audio
        )
        
        # Extract transcript
        transcript = ""
        confidence = 0
        if response.results:
            transcript = response.results[0].alternatives[0].transcript
            confidence = response.results[0].alternatives[0].confidence
        
        return {
            "transcript": transcript,
            "confidence": confidence
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "error": str(e),
            "transcript": "",
            "confidence": 0
        }

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "FastAPI Speech-to-Text service is running",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    """Check if Google credentials are loaded"""
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    return {
        "status": "healthy",
        "credentials_loaded": creds_path is not None,
        "credentials_path": creds_path
    }

# Run with uvicorn when executed directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
