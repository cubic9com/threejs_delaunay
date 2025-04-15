/**
 * Utility functions for color generation and manipulation
 */
const ColorUtils = {
    /**
     * Generate a pastel color from a seed value
     * @param {number} seed - Seed value
     * @returns {number} Color in hexadecimal format
     */
    generatePastelColor: function(seed) {
        // Generate pseudo-random numbers using seed
        const r = ((seed * 1664525 + 1013904223) % 128) + 128; // range 128-255
        const g = ((seed * 22695477 + 1) % 128) + 128; // range 128-255
        const b = ((seed * 214013 + 2531011) % 128) + 128; // range 128-255
        
        // Convert RGB values to hexadecimal format
        return (r << 16) | (g << 8) | b;
    }
};
