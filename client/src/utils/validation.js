/**
 * Validation Utilities
 * 
 * Input validation functions for forms
 */

/**
 * Validate phone number format
 * Expects: +92 followed by 10 digits
 * Example: +923001234567
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Remove spaces and check format
  const cleaned = phoneNumber.replace(/\s/g, '');
  const regex = /^\+92\d{10}$/;
  return regex.test(cleaned);
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return true; // Email is optional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password
 * Must contain at least one number
 * Minimum 6 characters
 */
export const validatePassword = (password) => {
  if (password.length < 6) return false;
  const hasNumber = /\d/.test(password);
  return hasNumber;
};

/**
 * Validate OTP code
 * Must be 6 digits
 */
export const validateOTP = (otp) => {
  const regex = /^\d{6}$/;
  return regex.test(otp);
};

/**
 * Validate name (no numbers or special characters)
 */
export const validateName = (name) => {
  const regex = /^[a-zA-Z\s]+$/;
  return regex.test(name) && name.trim().length > 0;
};
