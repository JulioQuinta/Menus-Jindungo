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
    // 3 digits
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
};

export const darkenColor = (hex, percent) => {
    const { r, g, b } = hexToRgb(hex);
    const f = 1 - percent / 100;
    const dr = Math.floor(r * f);
    const dg = Math.floor(g * f);
    const db = Math.floor(b * f);

    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
};
