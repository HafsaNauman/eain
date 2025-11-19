/**
 * Phone Number Input Component
 * 
 * Specialized input for Pakistan phone numbers
 * - Shows +92 prefix (non-editable)
 * - Formats input as user types
 * - Validates digit count
 * 
 * Example: User types "3001234567"
 * Display: "+92 300 1234567"
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const PhoneNumberInput = ({ 
  value, 
  onChangeText, 
  error,
  editable = true,
  label = 'Phone Number'
}) => {
  const [focused, setFocused] = useState(false);

  // Format phone number as user types
  const handleTextChange = (text) => {
    // Remove non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits (after +92)
    const limited = cleaned.slice(0, 10);
    
    // Format with spaces: 3XX XXXXXXX
    let formatted = limited;
    if (limited.length > 3) {
      formatted = `${limited.slice(0, 3)} ${limited.slice(3)}`;
    }
    
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        {/* Country code (non-editable) */}
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+92</Text>
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Phone number input */}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder="300 1234567"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="phone-pad"
          maxLength={12} // "3XX XXXXXXX"
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {!error && focused && (
        <Text style={styles.hint}>Enter 10 digits (e.g., 300 1234567)</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6,
  },
  countryCode: {
    paddingRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.error,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default PhoneNumberInput;
