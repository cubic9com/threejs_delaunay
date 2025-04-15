/**
 * Class responsible for managing points and their behavior
 */
class PointManager {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Three.js scene
     */
    constructor(scene) {
        this.points = []; // Array of Three.js meshes
        this.lastAddedPoint = null;
        this.scene = scene;
        this.triangulation = null; // Reference to triangulation (set later)
        
        // Geometry and material for points
        this.geometry = new THREE.CircleGeometry(DisplayConstants.POINT_RADIUS, 16);
        this.material = new THREE.MeshBasicMaterial({ color: RenderConstants.POINT_COLOR });
    }
    
    /**
     * Set reference to triangulation
     * @param {DelaunayTriangulation} triangulation - Triangulation
     */
    setTriangulation(triangulation) {
        this.triangulation = triangulation;
    }
    
    /**
     * Add a new point at the specified coordinates
     * @param {number} x - X coordinate on screen
     * @param {number} y - Y coordinate on screen
     * @returns {THREE.Mesh} The added point mesh
     */
    addPoint(x, y) {
        // If maximum number of points is reached, remove the oldest point
        if (this.points.length >= PointConstants.MAX_POINTS) {
            const oldestPoint = this.points.shift();
            this.removePoint(oldestPoint);
        }
        
        // Convert from screen coordinates to Three.js coordinates
        const threeX = x - window.innerWidth / 2;
        const threeY = window.innerHeight / 2 - y;
        
        // Create Three.js mesh
        const mesh = new THREE.Mesh(this.geometry, this.material);
        mesh.position.set(threeX, threeY, 0);
        
        // Add physics simulation properties
        mesh.userData = {
            vx: 0,        // velocity in x direction
            vy: 0,        // velocity in y direction
            origX: threeX, // original x position
            origY: threeY  // original y position
        };
        
        this.scene.add(mesh);
        
        // Add point to array
        this.points.push(mesh);
        
        // Record the last added point
        this.lastAddedPoint = mesh;
        
        return mesh;
    }
    
    /**
     * Remove a point and dispose associated resources
     * @param {THREE.Mesh} point - Point to remove
     */
    removePoint(point) {
        if (point) {
            this.scene.remove(point);
            // Clear user data
            point.userData = {};
        }
    }
    
    /**
     * Apply repulsion from a newly added point to all other points
     * @param {THREE.Mesh} newPoint - Newly added point
     */
    applyRepulsion(newPoint) {
        // Record the last added point
        this.lastAddedPoint = newPoint;
        
        // Calculate repulsion for all points
        for (const point of this.points) {
            // Don't apply to itself
            if (point === newPoint) continue;
            
            // Apply repulsion force
            this.applyRepulsionForce(point, newPoint, RepulsionConstants.STRENGTH, RepulsionConstants.RADIUS);
        }
        
        // Recalculate triangulation when points are added/removed
        if (this.triangulation && this.points.length >= 3) {
            this.triangulation.calculateAndDraw();
        }
    }
    
    /**
     * Apply repulsion force between two points
     * @param {THREE.Mesh} point - Point to apply force to
     * @param {THREE.Mesh} other - Other point causing repulsion
     * @param {number} strength - Force strength
     * @param {number} radius - Radius of influence
     */
    applyRepulsionForce(point, other, strength, radius) {
        const dx = point.position.x - other.position.x;
        const dy = point.position.y - other.position.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < radius * radius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = strength * (1.0 - dist / radius);
            
            point.userData.vx += dx / dist * force;
            point.userData.vy += dy / dist * force;
        }
    }
    
    /**
     * Apply Brownian motion to all points
     */
    applyBrownianMotion() {
        for (const point of this.points) {
            point.userData.vx += (Math.random() - 0.5) * BrownianConstants.STRENGTH;
            point.userData.vy += (Math.random() - 0.5) * BrownianConstants.STRENGTH;
        }
    }
    
    /**
     * Apply constraints to keep points near their original positions
     */
    applyPositionConstraints() {
        for (const point of this.points) {
            this.constrainToOriginalPosition(
                point,
                BrownianConstants.MAX_DISTANCE, 
                BrownianConstants.RETURN_FORCE
            );
        }
    }
    
    /**
     * Apply constraint to keep point near its original position
     * @param {THREE.Mesh} point - Point to constrain
     * @param {number} maxDistance - Maximum allowed distance
     * @param {number} returnForce - Return force strength
     */
    constrainToOriginalPosition(point, maxDistance, returnForce) {
        const dx = point.position.x - point.userData.origX;
        const dy = point.position.y - point.userData.origY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > maxDistance) {
            const force = (dist - maxDistance) * returnForce;
            point.userData.vx -= dx / dist * force;
            point.userData.vy -= dy / dist * force;
        }
    }
    
    /**
     * Apply friction to a point's velocity
     * @param {THREE.Mesh} point - Point to apply friction to
     * @param {number} friction - Friction coefficient
     */
    applyFriction(point, friction) {
        point.userData.vx *= friction;
        point.userData.vy *= friction;
    }
    
    /**
     * Constrain point to screen boundaries
     * @param {THREE.Mesh} point - Point to constrain
     * @param {number} halfWidth - Half of the screen width
     * @param {number} halfHeight - Half of the screen height
     * @param {number} bounceFactor - Bounce factor
     */
    constrainToScreen(point, halfWidth, halfHeight, bounceFactor) {
        if (point.position.x < -halfWidth) { 
            point.position.x = -halfWidth; 
            point.userData.vx = -point.userData.vx * bounceFactor; 
        }
        if (point.position.x > halfWidth) { 
            point.position.x = halfWidth; 
            point.userData.vx = -point.userData.vx * bounceFactor; 
        }
        if (point.position.y < -halfHeight) { 
            point.position.y = -halfHeight; 
            point.userData.vy = -point.userData.vy * bounceFactor; 
        }
        if (point.position.y > halfHeight) { 
            point.position.y = halfHeight; 
            point.userData.vy = -point.userData.vy * bounceFactor; 
        }
    }
    
    /**
     * Update all points' positions based on their velocities
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     */
    updatePoints(screenWidth, screenHeight) {
        // Apply Brownian motion
        this.applyBrownianMotion();
        
        // Apply constraints to keep points near original positions
        this.applyPositionConstraints();
        
        // Track if any positions changed
        let positionsChanged = false;
        
        for (const point of this.points) {
            // Save current position
            const oldX = point.position.x;
            const oldY = point.position.y;
            
            // Update position
            point.position.x += point.userData.vx;
            point.position.y += point.userData.vy;
            
            // Constrain to screen boundaries (in Three.js coordinate system)
            this.constrainToScreen(
                point,
                screenWidth / 2, 
                screenHeight / 2, 
                PhysicsConstants.BOUNCE_FACTOR
            );
            
            // Apply friction
            this.applyFriction(point, PhysicsConstants.FRICTION);
            
            // Check if position changed
            if (oldX !== point.position.x || oldY !== point.position.y) {
                positionsChanged = true;
            }
        }
        
        // Update triangle positions if points moved
        if (positionsChanged && this.triangulation) {
            this.triangulation.updateTrianglePositions();
        }
    }
    
    /**
     * Get the array of points
     * @returns {Array<THREE.Mesh>} Array of points
     */
    getPoints() {
        return this.points;
    }
    
    /**
     * Get the last added point
     * @returns {THREE.Mesh} Last added point
     */
    getLastAddedPoint() {
        return this.lastAddedPoint;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        // Remove all points
        for (const point of this.points) {
            this.removePoint(point);
        }
        this.points = [];
        
        // Dispose geometry and material
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    }
}
