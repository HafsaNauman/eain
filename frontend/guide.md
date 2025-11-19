🚀 Step-by-Step Setup Guide
1. Create the Project
bash
# Navigate to your desired directory
cd C:\Users\Hafsa Fatima\Documents\GitHub

# Create new Expo project
npx create-expo-app eain-frontend

# Navigate into project
cd eain-frontend
2. Install Dependencies
bash
npm install expo-av expo-file-system @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens axios @react-native-async-storage/async-storage
3. Create Folder Structure
bash
# Create all directories
mkdir src
mkdir src\config src\services src\screens src\components src\navigation src\context src\utils
4. Copy All Files
Copy the code from above into respective files following the folder structure.

5. Update Backend CORS (IMPORTANT)
In your backend app.js, ensure CORS is configured:

javascript
app.use(cors({
  origin: '*', // For development
  credentials: true
}));
6. Start Backend Server
bash
# In your backend directory
cd C:\Users\Hafsa Fatima\Documents\GitHub\eain
npm start
7. Start Frontend
bash
# In frontend directory
cd C:\Users\Hafsa Fatima\Documents\GitHub\eain-frontend
npm start
8. Run on Device
Choose one:

Press a for Android emulator

Press i for iOS simulator

Scan QR code with Expo Go app on physical device

📱 How to Use the App
Signup Flow:
Enter phone number (use 🎤 button for speech input)

Tap "Send OTP"

Enter OTP code (manual input)

Tap "Verify OTP"

Fill remaining fields with speech input:

Full Name 🎤

Email 🎤

Password (manual input)

Gender 🎤

Preferred Language 🎤

Literacy Level 🎤

Tap "Sign Up"

Login Flow:
Enter phone number (use 🎤 button)

Enter password (manual input)

Tap "Login"

Speech Input Instructions:
Tap 🎤 microphone button

Speak clearly

Tap ⏹ stop button when done

Wait for transcription

Text appears in field automatically

🔧 Troubleshooting
"Network Error"
Ensure backend is running on http://localhost:3000

If using physical device, replace localhost with your computer's IP:

javascript
// In api.config.js
BASE_URL: 'http://192.168.1.X:3000/api'
"Microphone Permission Denied"
Allow microphone access when prompted

Check device settings if denied

"Audio file not found"
Recording may have failed

Try again

"FastAPI connection failed"
Ensure FastAPI is running

Check backend logs for STT errors