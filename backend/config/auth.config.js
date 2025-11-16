import dotenv from 'dotenv';
dotenv.config();

export default {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h', // 24 hours
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d' // 7 days
};
