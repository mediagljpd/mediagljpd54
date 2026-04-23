/**
 * Determines if a hex color is light or dark to decide text color (black/white).
 */
export const isLight = (color: string): boolean => {
    if (color.indexOf('#') === 0) {
        color = color.slice(1);
    }
    if (color.length === 3) {
        color = color.split('').map(hex => hex + hex).join('');
    }
    if (color.length !== 6) {
      return true; // Default to light background assumption
    }

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // HSP (Highly Sensitive Poo) equation
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

    return hsp > 127.5;
}

/**
 * Formats a phone number string to XX-XX-XX-XX-XX.
 */
export const formatPhoneNumber = (phoneStr: string): string => {
    if (!phoneStr) return '';
    // Remove all non-digit characters
    const cleaned = ('' + phoneStr).replace(/\D/g, '');
    
    // Format if it has exactly 10 digits
    if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`;
        }
    }
    
    // If it has digits but not 10, just return as is (could be international or partial)
    // But for the sake of the user's request for "always", we try to group any digits
    if (cleaned.length > 0) {
        // Group by 2 digits for any length
        const parts = cleaned.match(/.{1,2}/g);
        return parts ? parts.join('-') : cleaned;
    }

    return phoneStr; 
};
