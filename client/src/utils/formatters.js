/**
 * Formatting Utilities
 * 
 * Format user input for display
 */

/**
 * Format phone number for display
 * Input: "3001234567"
 * Output: "+92 300 1234567"
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove any existing formatting
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add Pakistan country code if not present
  const withCountryCode = cleaned.startsWith('92') ? cleaned : `92${cleaned}`;
  
  // Format: +92 3XX XXXXXXX
  if (withCountryCode.length === 12) {
    return `+${withCountryCode.slice(0, 2)} ${withCountryCode.slice(2, 5)} ${withCountryCode.slice(5)}`;
  }
  
  return `+${withCountryCode}`;
};

/**
 * Parse formatted phone number to backend format
 * Input: "+92 300 1234567"
 * Output: "+923001234567"
 */
export const parsePhoneNumber = (formattedPhone) => {
  return formattedPhone.replace(/\s/g, '');
};

/**
 * Format OTP input (add space after 3 digits)
 * Input: "123456"
 * Output: "123 456"
 */
export const formatOTP = (otp) => {
  const cleaned = otp.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
};
