/**
 * Class responsible for handling input
 */
class InputHandler {
    /**
     * Constructor
     * @param {PointManager} pointManager - Point manager
     * @param {DelaunayTriangulation} triangulation - Delaunay triangulation
     * @param {HTMLElement} container - Container element to receive events
     * @param {AudioManager} audioManager - Audio manager
     */
    constructor(pointManager, triangulation, container, audioManager) {
        this.pointManager = pointManager;
        this.triangulation = triangulation;
        this.container = container;
        this.audioManager = audioManager;
        this.isTouch = false;
        
        // Store bound event handlers for later removal
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.container.addEventListener('mousedown', this.boundHandleMouseDown);
        
        // Touch events
        this.container.addEventListener('touchstart', this.boundHandleTouchStart);
        
        // Window resize event
        window.addEventListener('resize', this.boundHandleResize);
    }
    
    /**
     * Remove event listeners
     */
    removeEventListeners() {
        // Mouse events
        this.container.removeEventListener('mousedown', this.boundHandleMouseDown);
        
        // Touch events
        this.container.removeEventListener('touchstart', this.boundHandleTouchStart);
        
        // Window resize event
        window.removeEventListener('resize', this.boundHandleResize);
    }
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        // Get current touch state
        const wasTouch = this.isTouch;
        this.isTouch = true;
        
        // Process only at the moment touch begins
        if (!wasTouch) {
            // Get mouse coordinates
            const rect = this.container.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Play feedback sound
            if (this.audioManager) {
                this.audioManager.play('touch');
            }
            
            // Add new point at touch location
            const newPoint = this.pointManager.addPoint(x, y);
            
            // Apply repulsion to other points
            this.pointManager.applyRepulsion(newPoint);
        }
        
        // Listener to handle mouse up event only once
        const handleMouseUp = () => {
            this.isTouch = false;
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        // Prevent default scroll behavior
        event.preventDefault();
        
        // Get current touch state
        const wasTouch = this.isTouch;
        this.isTouch = true;
        
        // Process only at the moment touch begins
        if (!wasTouch) {
            // Get first touch point coordinates
            const touch = event.touches[0];
            const rect = this.container.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Play feedback sound
            if (this.audioManager) {
                this.audioManager.play('touch');
            }
            
            // Add new point at touch location
            const newPoint = this.pointManager.addPoint(x, y);
            
            // Apply repulsion to other points
            this.pointManager.applyRepulsion(newPoint);
        }
        
        // Listener to handle touch end event only once
        const handleTouchEnd = () => {
            this.isTouch = false;
            document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    /**
     * Get current touch state
     * @returns {boolean} true if currently touching
     */
    isTouching() {
        return this.isTouch;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        // Remove event listeners
        this.removeEventListeners();
    }
}
