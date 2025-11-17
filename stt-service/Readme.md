# Speech-to-Text Service (FastAPI)

Google Cloud Speech-to-Text microservice for transcribing audio files.

## Setup

1. **Create virtual environment:**
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows


2. **Install dependencies:**
pip install -r requirements.txt


3. **Set up Google Cloud credentials:**
- Download your `credentials.json` from Google Cloud Console
- Place it in the project root
- Update `.env` file with the path

4. **Run the service:**
python -m uvicorn app.main:app --reload --port 8000


## Endpoints

### POST /transcribe
Transcribe audio file to text.

**Request:**
- `file`: Audio file (WAV, MP3, etc.)
- `config`: JSON string with audio configuration

**Response:**
{
"transcript": "transcribed text",
"confidence": 0.95
}


### GET /health
Check service health and credentials status.

## Docker
docker build -t stt-service .
docker run -p 8000:8000 -v ./credentials.json:/app/credentials.json stt-service

