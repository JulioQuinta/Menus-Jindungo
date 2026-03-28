/**
 * Calculates the appropriate text color (white or black) 
 * given a background hex color to ensure readability.
 * 
 * @param {string} hexcolor - The background color in HEX (e.g. '#ffffff' or '#000')
 * @returns {string} - '#ffffff' for dark backgrounds, '#1a1a1a' for light backgrounds
 */
export const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#1a1a1a'; // Default dark text for empty/white backgrounds

    // If a short hex is provided (e.g. #000), expand it
    let hex = hexcolor.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Get YIQ ratio
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    return (yiq >= 128) ? '#1a1a1a' : '#ffffff';
};

export const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0;
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // 3 digits
    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    }
    // 6 digits
    else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return { r, g, b };
};

export const darkenColor = (hex, percent) => {
    try {
        const { r, g, b } = hexToRgb(hex);
        const f = 1 - percent / 100;
        
        // Clamp values between 0 and 255 to prevent overflow
        const dr = Math.min(255, Math.max(0, Math.floor(r * f)));
        const dg = Math.min(255, Math.max(0, Math.floor(g * f)));
        const db = Math.min(255, Math.max(0, Math.floor(b * f)));

        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
    } catch (e) {
        console.error("Error in darkenColor:", e);
        return hex; // Fallback to original
    }
};
