# Mobile App Frontend - React Native

Complete React Native frontend for mobile application with MERN stack backend integration.

## 🚀 Features

- ✅ Phone number authentication with OTP verification
- ✅ User registration and login
- ✅ Voice input for all text fields (Speech-to-Text)
- ✅ Cross-platform support (iOS, Android, Web)
- ✅ Complete form validation
- ✅ JWT token management
- ✅ Persistent authentication
- ✅ Clean, modern UI design

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for emulators)
- Backend server running on your local network

## 🔧 Installation

1. **Clone and navigate to project:**
cd mobile-app-frontend

text

2. **Install dependencies:**
npm install

text

3. **Configure API endpoint:**

Open `src/api/config.js` and update `YOUR_MACHINE_IP`:

// Find your IP address
// macOS/Linux: ifconfig | grep inet
// Windows: ipconfig

const API_CONFIG = {
BASE_URL: 'http://192.168.1.100:3000', // Replace with your IP
};

text

4. **Start the development server:**
npm start

text

## 📱 Running the App

### iOS (Mac only)
npm run ios

text

### Android
npm run android

text

### Web
npm run web

text

### Expo Go (Physical Device)
1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. Ensure phone and computer are on same WiFi

## 🔌 Backend Integration

### API Endpoints Used

**Authentication:**
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/signup` - Complete user registration
- `POST /api/auth/login` - User login

**Speech-to-Text:**
- `POST /api/stt/transcribe` - Transcribe audio to text

### Request/Response Examples

**Send OTP:**
// Request
POST /api/auth/send-otp
{
"phone_number": "+923001234567"
}

// Response
{
"success": true,
"message": "OTP sent successfully"
}

text

**Sign Up:**
// Request
POST /api/auth/signup
{
"full_name": "John Doe",
"phone_number": "+923001234567",
"email": "john@example.com",
"password": "password123",
"gender": "male",
"role": "customer"
}

// Response
{
"success": true,
"data": {
"user": { ...userData },
"accessToken": "jwt_token",
"refreshToken": "refresh_token"
}
}

text

## 🎤 Voice Input Feature

Voice input is available on all text input screens:
- Phone number entry
- OTP entry
- Sign up form fields
- Login fields

**How it works:**
1. User presses mic button
2. Audio recorded as .wav file (expo-av)
3. Sent to Node backend
4. Forwarded to FastAPI for Google Speech-to-Text
5. Transcribed text returned to frontend
6. Auto-populated in input field

**Audio Configuration:**
- Encoding: linear16
- Sample Rate: 44100 Hz
- Language: en-US

## 📂 Project Structure

src/
├── api/ # API services and configuration
├── components/ # Reusable components
│ ├── common/ # Buttons, inputs, alerts
│ ├── phone/ # Phone number input
│ └── voice/ # Voice recording components
├── screens/ # App screens
├── navigation/ # React Navigation setup
├── context/ # Global state management
├── utils/ # Helper functions
└── constants/ # Colors, fonts, dimensions

text

## 🎨 UI Components

### Custom Components
- **CustomButton** - Reusable button with variants
- **CustomInput** - Text input with validation
- **PhoneNumberInput** - Formatted phone input (+92)
- **VoiceInputButton** - Mic button with recording
- **ErrorAlert** - Error message display
- **LoadingSpinner** - Loading indicator

### Screens
1. **SplashScreen** - Initial loading screen
2. **PhoneNumberScreen** - Enter phone number
3. **OTPScreen** - Verify OTP code
4. **SignUpScreen** - Complete registration
5. **LoginScreen** - User login
6. **HomeScreen** - Post-login home

## 🔐 Authentication Flow

Enter Phone Number → 2. Verify OTP → 3. Sign Up → 4. Home
↓
5. Login → 4. Home

text

## 🛠️ Troubleshooting

### Issue: Cannot connect to backend

**Solution:**
1. Verify backend is running
2. Check API_CONFIG.BASE_URL in `src/api/config.js`
3. Ensure phone/computer on same network
4. For Android emulator, use `http://10.0.2.2:3000`
5. For iOS simulator, use `http://localhost:3000`

### Issue: Voice input not working

**Solution:**
1. Check microphone permissions
2. Verify FastAPI STT service is running
3. Check backend logs for errors
4. Test with Postman first

### Issue: OTP not being sent

**Solution:**
1. Check backend SMS service configuration
2. Verify phone number format (+92XXXXXXXXXX)
3. Check backend logs

## 📝 Environment Variables

Create `.env` file in root (optional):
API_BASE_URL=http://192.168.1.100:3000

text

## 🧪 Testing

**Test with your backend:**
1. Start backend server
2. Test endpoints with Postman
3. Run mobile app
4. Test complete auth flow

**Manual Testing Checklist:**
- [ ] Phone number validation
- [ ] OTP sending
- [ ] OTP verification
- [ ] Sign up form validation
- [ ] Login functionality
- [ ] Voice input on all screens
- [ ] Error handling
- [ ] Navigation flow

## 🚀 Building for Production

### Android APK
expo build:android

text

### iOS IPA
expo build:ios

text

### Expo EAS Build (Recommended)
npm install -g eas-cli
eas build --platform android
eas build --platform ios

text

## 📦 Key Dependencies

- **expo** - React Native platform
- **@react-navigation/native** - Navigation
- **axios** - HTTP client
- **expo-av** - Audio recording
- **@react-native-async-storage/async-storage** - Local storage
- **formik** - Form management
- **yup** - Validation

## 🤝 Contributing

1. Follow existing code structure
2. Add JSDoc comments to functions
3. Test on both iOS and Android
4. Update README for new features

## 📄 License

MIT License

## 👥 Support

For issues or questions:
- Check troubleshooting section
- Review backend API documentation
- Check Expo documentation: https://docs.expo.dev

---

**Built with ❤️ using React Native + Expo**