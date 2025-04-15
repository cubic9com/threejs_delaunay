/**
 * Class representing a triangle formed by three points
 */
class Triangle {
    /**
     * Constructor
     * @param {THREE.Mesh} p1 - First point
     * @param {THREE.Mesh} p2 - Second point
     * @param {THREE.Mesh} p3 - Third point
     */
    constructor(p1, p2, p3) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    /**
     * Check if a point is inside the circumcircle of this triangle
     * @param {THREE.Mesh} p - Point to check
     * @returns {boolean} true if the point is inside the circumcircle
     */
    isPointInCircumcircle(p) {
        // Three points of the triangle
        const x1 = this.p1.position.x;
        const y1 = this.p1.position.y;
        const x2 = this.p2.position.x;
        const y2 = this.p2.position.y;
        const x3 = this.p3.position.x;
        const y3 = this.p3.position.y;
        
        // Calculate determinant
        const a = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
        
        // Handle degenerate case (colinear points)
        if (Math.abs(a) < 1e-6) return false;
        
        const b = (x1 * x1 + y1 * y1) * (y3 - y2) + 
                  (x2 * x2 + y2 * y2) * (y1 - y3) + 
                  (x3 * x3 + y3 * y3) * (y2 - y1);
        
        const c = (x1 * x1 + y1 * y1) * (x2 - x3) + 
                  (x2 * x2 + y2 * y2) * (x3 - x1) + 
                  (x3 * x3 + y3 * y3) * (x1 - x2);
        
        const d = (x1 * x1 + y1 * y1) * (x3 * y2 - x2 * y3) + 
                  (x2 * x2 + y2 * y2) * (x1 * y3 - x3 * y1) + 
                  (x3 * x3 + y3 * y3) * (x2 * y1 - x1 * y2);
        
        // Center and squared radius of circumcircle
        const centerX = -b / (2 * a);
        const centerY = -c / (2 * a);
        const radiusSquared = (b * b + c * c - 4 * a * d) / (4 * a * a);
        
        // Squared distance between point and center
        const distSq = (p.position.x - centerX) * (p.position.x - centerX) + 
                       (p.position.y - centerY) * (p.position.y - centerY);
        
        // Inside circle if distance is less than radius
        return distSq < radiusSquared;
    }

    /**
     * Generate a unique color seed for this triangle (for consistent coloring)
     * @returns {number} Color seed
     */
    getColorSeed() {
        // Use point coordinates to create a unique seed
        const x1 = Math.floor(this.p1.position.x * 73856093);
        const y1 = Math.floor(this.p1.position.y * 19349663);
        const x2 = Math.floor(this.p2.position.x * 83492791);
        const y2 = Math.floor(this.p2.position.y * 52801763);
        const x3 = Math.floor(this.p3.position.x * 92083207);
        const y3 = Math.floor(this.p3.position.y * 73856093);
        
        // Combine coordinates to create a seed
        return (x1 ^ y1 ^ x2 ^ y2 ^ x3 ^ y3) >>> 0;
    }
}
