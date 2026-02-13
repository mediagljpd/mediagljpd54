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
    
    // Only format if it's a 10-digit number
    if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`;
        }
    }

    return phoneStr; // Return original if not a 10-digit French number
};
