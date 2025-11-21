/**
 * EAIN Color Theme
 * 
 * Complete color palette for the EAIN mobile application
 * Based on the elegant teal-peach gradient splash screen design
 * 
 * Usage:
 * import { COLORS } from '../constants/colors';
 * style={{ backgroundColor: COLORS.primary }}
 */

export const COLORS = {
  // ============================================
  // PRIMARY EAIN BRAND COLORS (Muted Teal Palette)
  // ============================================
  primary: '#89B5A8',           // Main teal - buttons, links, primary actions
  primaryLight: '#A8C8BC',      // Light teal - backgrounds, hover states
  primaryDark: '#2F5D5D',       // Deep teal - text, headings, emphasis
  
  // ============================================
  // GRADIENT COLORS (Splash Screen)
  // ============================================
  gradientStart: '#89B5A8',     // Top gradient color
  gradientMiddle: '#99BFB3',    // Middle gradient color
  gradientEnd: '#A8C8BC',       // Bottom gradient color
  
  // ============================================
  // ACCENT COLORS (Peach/Coral from Wave)
  // ============================================
  accent: '#E8B5A3',            // Soft peach - accents, highlights
  accentLight: '#F5D4C8',       // Light peach - backgrounds
  accentDark: '#D89A85',        // Darker peach - borders, emphasis
  
  // ============================================
  // TEXT COLORS
  // ============================================
  text: '#2F5D5D',              // Primary text - dark teal
  textSecondary: '#6B8E88',     // Secondary text - muted teal
  textLight: '#FFFFFF',         // Light text - white
  textDisabled: '#B0C4C0',      // Disabled text
  placeholder: '#9CB5AF',       // Input placeholder text
  
  // ============================================
  // BACKGROUND COLORS
  // ============================================
  background: '#FFFFFF',        // Main background - white
  backgroundSecondary: '#F8FAFA', // Secondary background
  inputBackground: '#F9FAFB',   // Input field backgrounds
  cardBackground: '#FFFFFF',    // Card backgrounds
  overlayBackground: 'rgba(47, 93, 93, 0.5)', // Modal overlays
  
  // ============================================
  // UI ELEMENT COLORS
  // ============================================
  border: '#D1E3DF',            // Default borders
  borderLight: '#E8F0EE',       // Light borders
  borderDark: '#A8C8BC',        // Dark borders
  divider: '#E5E7EB',           // Divider lines
  disabled: '#D1D5DB',          // Disabled elements
  shadow: 'rgba(47, 93, 93, 0.1)', // Shadow color
  
  // ============================================
  // BUTTON COLORS
  // ============================================
  buttonPrimary: '#89B5A8',     // Primary button background
  buttonPrimaryText: '#FFFFFF', // Primary button text
  buttonSecondary: '#F9FAFB',   // Secondary button background
  buttonSecondaryText: '#2F5D5D', // Secondary button text
  buttonDisabled: '#D1D5DB',    // Disabled button
  buttonDisabledText: '#9CA3AF', // Disabled button text
  
  // ============================================
  // STATUS COLORS
  // ============================================
  // Success (Green)
  success: '#10B981',           // Success messages, checkmarks
  successBackground: '#D1FAE5', // Success background
  successBorder: '#6EE7B7',     // Success borders
  
  // Error (Red)
  error: '#EF4444',             // Error messages, alerts
  errorBackground: '#FEE2E2',   // Error background
  errorBorder: '#FCA5A5',       // Error borders
  
  // Warning (Orange/Amber)
  warning: '#F59E0B',           // Warning messages
  warningBackground: '#FEF3C7', // Warning background
  warningBorder: '#FCD34D',     // Warning borders
  
  // Info (Teal - matching brand)
  info: '#89B5A8',              // Info messages
  infoBackground: '#E8F5F2',    // Info background
  infoBorder: '#A8C8BC',        // Info borders
  
  // ============================================
  // NEUTRAL GRAYSCALE
  // ============================================
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale (100 = lightest, 900 = darkest)
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // ============================================
  // SPECIAL COLORS
  // ============================================
  transparent: 'transparent',
  
  // Input states
  inputFocusBorder: '#89B5A8',  // Input border when focused
  inputErrorBorder: '#EF4444',  // Input border on error
  
  // Voice recording indicator
  recordingRed: '#DC2626',      // Recording active indicator
  recordingBackground: '#FEE2E2', // Recording background
  
  // OTP input
  otpFilled: '#89B5A8',         // Filled OTP box background
  otpEmpty: '#F9FAFB',          // Empty OTP box background
  
  // Phone number prefix
  countryCodeBackground: '#E8F5F2', // +92 background
  
  // Links
  link: '#89B5A8',              // Clickable links
  linkHover: '#2F5D5D',         // Link hover state
  
  // ============================================
  // SEMANTIC COLORS (for easy reference)
  // ============================================
  // Use these for specific UI elements
  splashGradient: ['#89B5A8', '#99BFB3', '#A8C8BC'], // Array for LinearGradient
  waveOpacity: 0.65,            // Opacity for wave overlay
  
  // Header/Navigation
  headerBackground: '#89B5A8',
  headerText: '#FFFFFF',
  
  // Bottom Tab Bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#89B5A8',
  tabBarInactive: '#9CA3AF',
  
  // Modal
  modalBackground: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Loading
  loadingSpinner: '#89B5A8',
  loadingBackground: 'rgba(255, 255, 255, 0.9)',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Add opacity to any hex color
 * 
 * @param {string} hex - Hex color code (e.g., '#89B5A8')
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGBA color string
 * 
 * Usage: addOpacity(COLORS.primary, 0.5)
 */
export const addOpacity = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get gradient array for LinearGradient
 * 
 * @param {string} type - 'splash' | 'button' | 'card'
 * @returns {array} Array of color strings
 * 
 * Usage: <LinearGradient colors={getGradient('splash')} />
 */
export const getGradient = (type = 'splash') => {
  const gradients = {
    splash: [COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd],
    button: [COLORS.primary, COLORS.primaryDark],
    card: [COLORS.white, COLORS.backgroundSecondary],
    accent: [COLORS.accent, COLORS.accentDark],
  };
  return gradients[type] || gradients.splash;
};

/**
 * Get status color
 * 
 * @param {string} status - 'success' | 'error' | 'warning' | 'info'
 * @returns {object} Object with color, background, and border
 * 
 * Usage: const statusColors = getStatusColor('error');
 */
export const getStatusColor = (status) => {
  const statusColors = {
    success: {
      color: COLORS.success,
      background: COLORS.successBackground,
      border: COLORS.successBorder,
    },
    error: {
      color: COLORS.error,
      background: COLORS.errorBackground,
      border: COLORS.errorBorder,
    },
    warning: {
      color: COLORS.warning,
      background: COLORS.warningBackground,
      border: COLORS.warningBorder,
    },
    info: {
      color: COLORS.info,
      background: COLORS.infoBackground,
      border: COLORS.infoBorder,
    },
  };
  return statusColors[status] || statusColors.info;
};

// Default export
export default COLORS;
