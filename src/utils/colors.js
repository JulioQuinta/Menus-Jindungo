/**
 * Calculates the best text color (black or white) given a background color.
 * Uses the YIQ formula for contrast.
 */
export const getContrastColor = (hexcolor) => {
    if (!hexcolor) return 'black';

    // If hexcolor starts with #, remove it
    const hex = hexcolor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate YIQ ratio
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Return black or white based on luminance
    return (yiq >= 128) ? 'black' : 'white';
};

/**
 * Validates if the string is a valid hex color
 */
export const isValidHex = (hex) => {
    return /^#[0-9A-F]{6}$/i.test(hex);
}
