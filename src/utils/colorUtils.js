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
