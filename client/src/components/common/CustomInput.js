/**
 * Custom Input Component
 * 
 * Reusable text input with validation and error display
 * 
 * Props:
 * - label: Input label
 * - value: Input value
 * - onChangeText: Change handler
 * - placeholder: Placeholder text
 * - error: Error message to display
 * - secureTextEntry: Hide text (for passwords)
 * - keyboardType: Keyboard type
 * - editable: Whether input is editable
 * - autoCapitalize: Auto capitalization
 * - rightIcon: Component to display on right side
 */

/**
 * Custom Input Component
 * 
 * Compact version for better screen fit
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  autoCapitalize = 'none',
  rightIcon,
  multiline = false,
  numberOfLines = 1,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={[
            styles.input,
            !editable && styles.inputDisabled,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputDisabled: {
    backgroundColor: COLORS.disabled,
    color: COLORS.textSecondary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.error,
    marginLeft: 4,
  },
});

export default CustomInput;
