/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.html", "./**/*.js", "!./node_modules/**"],
    theme: {
        extend: {
            colors: {
                // Vibrant pink - primary brand color (Sean O'Malley inspired)
                "brand-pink": "#FF4081",
                "brand-pink-accessible": "#FF6B9D", // Enhanced pink for better small text contrast (7.2:1)
                "brand-pink-dark": "#D81B60", // Darker pink for gradients
                "brand-pink-light": "#FF6BA3", // Lighter pink for subtle accents
                
                // Neon blue - Sugar Sean O'Malley inspired (cool as hell!)
                "neon-blue": "#00F0FF", // Bright cyan blue
                "neon-blue-accessible": "#1AF5FF", // Enhanced blue for consistency (15.2:1)
                "neon-blue-dark": "#0099CC", // Darker blue for gradients
                "neon-blue-light": "#33F3FF", // Lighter blue for glows
                
                // True black background for maximum contrast and sleekness
                "brand-dark": "#000000", // Pure black - cleanest, sleekest look
                "brand-charcoal": "#0F0F0F", // Slightly lighter for cards/overlays
                
                // Optional: Subtle accent color (use sparingly for variety)
                "brand-accent": "#8B5CF6", // Soft purple - complements pink beautifully
            },
            fontFamily: {
                // Now you can use class="font-display" instead of hardcoded styles
                sans: ["Inter", "sans-serif"],
                display: ["Lora", "serif"],
            },
            // Your custom animations from before
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                shimmer: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                float: "float 6s ease-in-out infinite",
                shimmer: "shimmer 2s infinite",
            },
        },
    },
    plugins: [],
};
