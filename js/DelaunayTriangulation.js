/**
 * Class for managing Delaunay triangulation
 */
class DelaunayTriangulation {
    /**
     * Constructor
     * @param {PointManager} pointManager - Point manager
     * @param {THREE.Scene} scene - Three.js scene
     */
    constructor(pointManager, scene) {
        this.pointManager = pointManager;
        this.scene = scene;
        this.triangles = [];
        this.meshes = [];
        
        // Constants
        this.Z_OFFSET = -0.1; // Z-coordinate offset (to control drawing order)
    }

    /**
     * Find all Delaunay triangles from the current set of points
     * @returns {Array<Triangle>} Array of Delaunay triangles
     */
    findDelaunayTriangles() {
        const points = this.pointManager.getPoints();
        const delaunayTriangles = [];
        
        // Cannot form triangles with fewer than 3 points
        if (points.length < 3) {
            return delaunayTriangles;
        }
        
        // Check all possible triangle combinations
        for (let i = 0; i < points.length - 2; i++) {
            for (let j = i + 1; j < points.length - 1; j++) {
                for (let k = j + 1; k < points.length; k++) {
                    const tri = new Triangle(points[i], points[j], points[k]);
                    
                    // Check if no other points are inside this triangle's circumcircle
                    let isDelaunay = true;
                    for (let l = 0; l < points.length; l++) {
                        if (l !== i && l !== j && l !== k) {
                            if (tri.isPointInCircumcircle(points[l])) {
                                isDelaunay = false;
                                break;
                            }
                        }
                    }
                    
                    // Add to list if it satisfies Delaunay condition
                    if (isDelaunay) {
                        delaunayTriangles.push(tri);
                    }
                }
            }
        }
        
        return delaunayTriangles;
    }

    /**
     * Calculate and draw the Delaunay triangulation
     */
    calculateAndDraw() {
        // Clear previous triangle meshes
        this.clearTriangleMeshes();
        
        // Calculate and draw triangles if we have enough points
        const points = this.pointManager.getPoints();
        if (points.length >= 3) {
            this.triangles = this.findDelaunayTriangles();
            
            // Draw each triangle
            for (const triangle of this.triangles) {
                this.drawTriangle(triangle);
            }
        }
    }

    /**
     * Get the vertices of a triangle
     * @param {Triangle} triangle - Triangle
     * @returns {Array<THREE.Vector3>} Array of vertex coordinates
     */
    getTriangleVertices(triangle) {
        return [
            new THREE.Vector3(triangle.p1.position.x, triangle.p1.position.y, this.Z_OFFSET),
            new THREE.Vector3(triangle.p2.position.x, triangle.p2.position.y, this.Z_OFFSET),
            new THREE.Vector3(triangle.p3.position.x, triangle.p3.position.y, this.Z_OFFSET)
        ];
    }

    /**
     * Draw a single triangle
     * @param {Triangle} triangle - Triangle to draw
     */
    drawTriangle(triangle) {
        // Generate pastel color from triangle's seed value
        const colorSeed = triangle.getColorSeed();
        const color = ColorUtils.generatePastelColor(colorSeed);
        
        // Get triangle vertices
        const vertices = this.getTriangleVertices(triangle);
        
        // Create vertex array for the 3 edges of the triangle
        const lineVertices = [];
        for (let i = 0; i < 3; i++) {
            lineVertices.push(vertices[i]);
            lineVertices.push(vertices[(i + 1) % 3]);
        }
        
        // Create geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(lineVertices);
        
        // Create material
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: DisplayConstants.LINE_THICKNESS
        });
        
        // Create line object
        const lineSegments = new THREE.LineSegments(geometry, material);
        this.scene.add(lineSegments);
        
        // Store mesh information
        this.meshes.push({
            line: lineSegments,
            geometry: geometry,
            material: material,
            triangle: triangle
        });
    }
    
    /**
     * Update triangle vertex positions (to follow point movements)
     */
    updateTrianglePositions() {
        for (const meshObj of this.meshes) {
            const triangle = meshObj.triangle;
            
            // Get triangle vertices
            const vertices = this.getTriangleVertices(triangle);
            
            // Create vertex array for the 3 edges of the triangle
            const positions = new Float32Array(18); // 3 edges × 2 vertices × 3 coordinates = 18
            for (let i = 0, offset = 0; i < 3; i++) {
                // Start point of edge
                positions[offset++] = vertices[i].x;
                positions[offset++] = vertices[i].y;
                positions[offset++] = vertices[i].z;
                
                // End point of edge
                const nextIndex = (i + 1) % 3;
                positions[offset++] = vertices[nextIndex].x;
                positions[offset++] = vertices[nextIndex].y;
                positions[offset++] = vertices[nextIndex].z;
            }
            
            // Update geometry vertex positions
            meshObj.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            meshObj.geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Clear previous triangle meshes
     */
    clearTriangleMeshes() {
        // Remove all meshes from scene and dispose resources
        for (const meshObj of this.meshes) {
            this.scene.remove(meshObj.line);
            meshObj.geometry.dispose();
            meshObj.material.dispose();
        }
        
        // Clear mesh array
        this.meshes = [];
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        this.clearTriangleMeshes();
        this.triangles = [];
    }
}
