/**
 * Class for managing audio effects
 */
class AudioManager {
    /**
     * Constructor
     */
    constructor() {
        // Audio context
        this.context = null;
        
        // Active audio nodes
        this.activeNodes = new Set();
        
        // Audio effect definitions
        this.effects = {
            touch: {
                type: 'oscillator',
                options: {
                    type: 'sine',
                    frequency: AudioConstants.TONE_FREQUENCY,
                    volume: AudioConstants.TONE_VOLUME,
                    duration: AudioConstants.TONE_DURATION
                }
            }
        };
        
        // Initialize audio context
        this.initContext();
    }
    
    /**
     * Initialize audio context
     */
    initContext() {
        try {
            // Check for Web Audio API support
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API is not supported:', e);
        }
    }
    
    /**
     * Play a specified sound effect
     * @param {string} effectName - Name of the effect to play
     * @returns {boolean} Whether playback started successfully
     */
    play(effectName) {
        // Do nothing if context is not available
        if (!this.context) {
            return false;
        }
        
        // Get effect definition
        const effect = this.effects[effectName];
        if (!effect) {
            console.warn(`Effect "${effectName}" is not defined`);
            return false;
        }
        
        // Play based on effect type
        switch (effect.type) {
            case 'oscillator':
                this.playOscillator(effect.options);
                return true;
            default:
                console.warn(`Unknown effect type: ${effect.type}`);
                return false;
        }
    }
    
    /**
     * Play oscillator effect
     * @param {Object} options - Oscillator options
     * @param {string} options.type - Oscillator type (sine, square, sawtooth, triangle)
     * @param {number} options.frequency - Frequency in Hz
     * @param {number} options.volume - Volume (0.0 to 1.0)
     * @param {number} options.duration - Duration in milliseconds
     */
    playOscillator(options) {
        // Create oscillator and gain node
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        // Set oscillator properties
        oscillator.type = options.type || 'sine';
        oscillator.frequency.value = options.frequency || 440;
        
        // Set gain
        gainNode.gain.value = options.volume || 0.5;
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // Track active nodes
        this.activeNodes.add(oscillator);
        this.activeNodes.add(gainNode);
        
        // Start playback
        oscillator.start();
        
        // Stop after specified duration
        const duration = options.duration || 500;
        setTimeout(() => {
            try {
                oscillator.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            
            // Remove from tracking list
            this.activeNodes.delete(oscillator);
            this.activeNodes.delete(gainNode);
            
            // Disconnect nodes
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) {
                // Ignore errors if disconnection fails
            }
        }, duration);
    }
    
    /**
     * Add or update an effect
     * @param {string} name - Effect name
     * @param {Object} definition - Effect definition
     */
    addEffect(name, definition) {
        this.effects[name] = definition;
    }
    
    /**
     * Dispose all resources
     */
    dispose() {
        // Stop all active nodes
        for (const node of this.activeNodes) {
            try {
                // Stop oscillators
                if (node.stop) {
                    node.stop();
                }
                
                // Disconnect nodes
                if (node.disconnect) {
                    node.disconnect();
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        // Clear active nodes list
        this.activeNodes.clear();
        
        // Close audio context
        if (this.context && this.context.state !== 'closed') {
            this.context.close().catch(e => {
                console.warn('Error closing audio context:', e);
            });
        }
    }
}
