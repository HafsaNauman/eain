/**
 * Text Utilities
 * 
 * Helper functions for cleaning and formatting text
 */

/**
 * Clean transcribed text for form inputs
 * Removes trailing punctuation (periods, commas, etc.)
 * Capitalizes first letter for names
 * 
 * @param {string} text - Raw transcribed text
 * @param {string} fieldType - Type of field ('name', 'email', 'default')
 * @returns {string} Cleaned text
 */
export const cleanTranscribedText = (text, fieldType = 'default') => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let cleaned = text.trim();

    // Remove trailing punctuation (period, comma, exclamation, question mark)
    cleaned = cleaned.replace(/[.,!?;:]+$/, '');

    // Field-specific formatting
    switch (fieldType) {
        case 'name':
        case 'business':
            // Capitalize first letter of each word for names/business fields
            cleaned = cleaned
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            break;

        case 'email':
            // Convert to lowercase, remove spaces
            cleaned = cleaned.toLowerCase().replace(/\s+/g, '');
            break;

        default:
            // 'search', and any other fields: just trim and remove trailing punctuation
            break;
    }

    return cleaned;
};

/**
 * Format text for specific input types
 * 
 * @param {string} text - Text to format
 * @param {string} inputType - Type of input ('phone', 'number', 'text')
 * @returns {string} Formatted text
 */
export const formatInputText = (text, inputType = 'text') => {
    if (!text) return '';

    switch (inputType) {
        case 'phone':
            // Extract only digits
            return text.replace(/\D/g, '');

        case 'number':
            // Extract digits and decimal point
            return text.replace(/[^\d.]/g, '');

        case 'text':
        default:
            return text.trim();
    }
};
