/**
 * Error Alert Component
 * 
 * Displays error messages in a styled container
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const ErrorAlert = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={24} color={COLORS.error} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FED7D7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    backgroundColor: '#FFE5E5',
    padding: 4,
    borderRadius: 20,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#C53030',
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default ErrorAlert;
