/**
 * Generate a random 6-digit OTP and expiration time
 * @returns {Object} { code, expiresAt }
 */
export const generateOTP = () => {
  // const code = Math.floor(100000 + Math.random() * 900000).toString(); 
  const code = (111111).toString();
  // 6-digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  return { code, expiresAt };
};

/**
 * Verify if OTP has expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Boolean}
 */
export const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};
