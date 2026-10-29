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
        // Incircle test in determinant form, using coordinates relative
        // to the test point. Unlike the circumcenter/circumradius form,
        // this needs no division and stays numerically accurate because
        // all values are small differences of coordinates.
        const ax = this.p1.position.x - p.position.x;
        const ay = this.p1.position.y - p.position.y;
        const bx = this.p2.position.x - p.position.x;
        const by = this.p2.position.y - p.position.y;
        const cx = this.p3.position.x - p.position.x;
        const cy = this.p3.position.y - p.position.y;
        
        const det = (ax * ax + ay * ay) * (bx * cy - cx * by)
                  - (bx * bx + by * by) * (ax * cy - cx * ay)
                  + (cx * cx + cy * cy) * (ax * by - bx * ay);
        
        // Signed area of the triangle (zero for collinear points, which
        // have no circumcircle)
        const orient = (this.p2.position.x - this.p1.position.x) * (this.p3.position.y - this.p1.position.y)
                     - (this.p2.position.y - this.p1.position.y) * (this.p3.position.x - this.p1.position.x);
        if (orient === 0) return false;
        
        return orient > 0 ? det > 0 : det < 0;
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
