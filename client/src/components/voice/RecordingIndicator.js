/**
 * Recording Indicator Component
 * 
 * Visual feedback for active recording
 * Shows animated recording icon
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const RecordingIndicator = ({ isRecording }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.icon}>🎤</Text>
      </Animated.View>
      <Text style={styles.text}>Recording...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default RecordingIndicator;
