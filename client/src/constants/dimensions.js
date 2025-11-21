/**
 * Dimension Constants
 * 
 * Responsive spacing and sizing
 */

import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const DIMENSIONS = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  // Common sizes
  buttonHeight: 56,
  inputHeight: 56,
  headerHeight: 60,
};
