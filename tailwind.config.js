/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Premium Palette
                primary: '#D4AF37',   // Gold
                secondary: '#2D3436', // Dark Grey Deep
                success: '#00B894',   // Emerald Green
                error: '#D63031',     // Red
                jindungo: '#8B0000',  // Malagueta Red [NEW]

                // Dark Mode Grounds
                dark: {
                    bg: '#121212',
                    card: '#1E1E1E',
                    input: '#2D3436'
                },

                // Legacy variable support (optional, keeping for safety)
                'brand-primary': 'var(--color-primary)',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                serif: ['Playfair Display', 'ui-serif', 'Georgia'],
            },
            animation: {
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-in-out', // [NEW]
            },
            keyframes: {
                fadeIn: { // [NEW]
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                keyframes: {
                    shake: {
                        '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                        '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                        '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                        '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                    }
                }
            },
        },
        plugins: [],
    }
