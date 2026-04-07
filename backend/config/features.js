// config/features.js
// Feature flags — flip to true when ready to expose in production
// Set via environment variables so no code push needed

export const FEATURES = {
  SERVICE_PROVIDER: process.env.FEATURE_SERVICE_PROVIDER === 'true',   // service provider routes
  SERVICE_DASHBOARD: process.env.FEATURE_SERVICE_DASHBOARD === 'true',  // dashboard endpoint
  SERVICE_AVAILABILITY: process.env.FEATURE_SERVICE_AVAILABILITY === 'true', // availability mgmt
};
