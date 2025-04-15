/**
 * Delaunay Triangulation Application
 */
class DelaunayApp {
    /**
     * Constructor
     */
    constructor() {
        // Initialize
        this.container = document.getElementById('container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Animation frame ID (for cancellation)
        this.animationFrameId = null;
        
        // Store bound event handlers for later removal
        this.boundOnWindowResize = this.onWindowResize.bind(this);
        this.boundAnimate = this.animate.bind(this);
        
        // Initialize Three.js
        this.initThree();
        
        // Initialize components
        this.initComponents();
        
        // Calculate and draw initial triangulation
        this.triangulation.calculateAndDraw();
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Initialize Three.js
     */
    initThree() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(RenderConstants.BACKGROUND_COLOR);
        
        // Create camera
        this.camera = new THREE.OrthographicCamera(
            -this.width / 2, this.width / 2,
            this.height / 2, -this.height / 2,
            0.1, 1000
        );
        this.camera.position.z = 10;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);
        
        // Handle window resize event
        window.addEventListener('resize', this.boundOnWindowResize);
    }
    
    /**
     * Initialize components
     */
    initComponents() {
        // Create point manager
        this.pointManager = new PointManager(this.scene);
        
        // Create Delaunay triangulation
        this.triangulation = new DelaunayTriangulation(this.pointManager, this.scene);
        
        // Set triangulation reference in point manager
        this.pointManager.setTriangulation(this.triangulation);
        
        // Create audio manager
        this.audioManager = new AudioManager();
        
        // Create input handler
        this.inputHandler = new InputHandler(
            this.pointManager,
            this.triangulation,
            this.renderer.domElement,
            this.audioManager
        );
    }
    
    /**
     * Handle window resize event
     */
    onWindowResize() {
        // Get new size
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Update camera
        this.camera.right = this.width / 2;
        this.camera.left = -this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = -this.height / 2;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(this.width, this.height);
        
        // Recalculate triangulation on window resize
        this.triangulation.calculateAndDraw();
    }
    
    /**
     * Animation loop
     */
    animate() {
        // Request next frame (store ID)
        this.animationFrameId = requestAnimationFrame(this.boundAnimate);
        
        // Update point positions
        this.pointManager.updatePoints(this.width, this.height);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        // Stop animation loop
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.boundOnWindowResize);
        
        // Dispose component resources
        if (this.inputHandler) {
            this.inputHandler.dispose();
        }
        
        if (this.audioManager) {
            this.audioManager.dispose();
        }
        
        if (this.triangulation) {
            this.triangulation.dispose();
        }
        
        if (this.pointManager) {
            this.pointManager.dispose();
        }
        
        // Dispose Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            
            // Remove renderer DOM element
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        
        // Remove scene references
        this.scene = null;
        this.camera = null;
    }
}

// Application instance
let app = null;

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new DelaunayApp();
    
    // Release resources when page is unloaded
    window.addEventListener('beforeunload', () => {
        if (app) {
            app.dispose();
            app = null;
        }
    });
});
