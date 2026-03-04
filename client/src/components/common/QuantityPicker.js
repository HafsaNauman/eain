import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuantityPicker = ({ value, onChange, max = 999, min = 1 }) => (
    <View style={styles.container}>
        <TouchableOpacity
            style={styles.button}
            onPress={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
        >
            <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{value}</Text>
        <TouchableOpacity
            style={styles.button}
            onPress={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
        >
            <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 20,
        height: 48,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#036c5f',
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        minWidth: 40,
        textAlign: 'center',
    },
});

export default QuantityPicker;
