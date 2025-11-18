import express from 'express';
import { 
  sendOTP, 
  verifyOTP, 
  signup, 
  login 
} from '../controllers/auth.controller.js';
import { 
  checkDuplicatePhoneOrEmail, 
  validateSignupFields 
} from '../middlewares/verifySignUp.js';

const router = express.Router();


  // Auth Routes
 

// STEP 1: Send OTP to phone number
router.post('/send-otp', sendOTP);

// STEP 2: Verify OTP code
router.post('/verify-otp', verifyOTP);

// STEP 3: Complete signup (after OTP verification)
router.post(
  '/signup',
  [validateSignupFields, checkDuplicatePhoneOrEmail],
  signup
);

// Login
router.post('/login', login);

export default router;
