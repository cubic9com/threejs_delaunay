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
        
        // Unique edges of the triangulation, drawn as a single LineSegments
        // (each edge keeps the color of the first triangle that used it)
        this.edges = [];
        this.line = null;
        this.lineGeometry = null;
        this.lineMaterial = null;
        
        // Constants
        this.Z_OFFSET = -0.1; // Z-coordinate offset (to control drawing order)
    }

    /**
     * Find all Delaunay triangles from the current set of points
     * (Bowyer-Watson incremental algorithm: insert the points one by one,
     * removing the triangles whose circumcircle contains the new point and
     * retriangulating the hole that remains)
     * @returns {Array<Triangle>} Array of Delaunay triangles
     */
    findDelaunayTriangles() {
        const points = this.pointManager.getPoints();
        
        // Cannot form triangles with fewer than 3 points
        if (points.length < 3) {
            return [];
        }
        
        // Bounding box of the point set
        let minX = points[0].position.x, maxX = points[0].position.x;
        let minY = points[0].position.y, maxY = points[0].position.y;
        for (const point of points) {
            minX = Math.min(minX, point.position.x);
            maxX = Math.max(maxX, point.position.x);
            minY = Math.min(minY, point.position.y);
            maxY = Math.max(maxY, point.position.y);
        }
        
        // Super-triangle that surely contains all points (its vertices are
        // removed again at the end). The margin has to be very large: the
        // circumcircle of a flat triangle near the convex hull can extend
        // far beyond the point set, and a super-triangle vertex inside such
        // a circumcircle would suppress the real hull triangle.
        // The super-triangle vertices are plain objects with a position,
        // which is all the Triangle class accesses.
        let dmax = Math.max(maxX - minX, maxY - minY);
        if (dmax < 1) {
            dmax = 1;
        }
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const SUPER_MARGIN = 1e6;
        const superPoint1 = { position: { x: midX - SUPER_MARGIN * dmax, y: midY - dmax } };
        const superPoint2 = { position: { x: midX, y: midY + SUPER_MARGIN * dmax } };
        const superPoint3 = { position: { x: midX + SUPER_MARGIN * dmax, y: midY - dmax } };
        const superPoints = [superPoint1, superPoint2, superPoint3];
        
        // Start with the super-triangle
        let triangles = [new Triangle(superPoint1, superPoint2, superPoint3)];
        
        // Insert the points one by one
        for (const point of points) {
            // Find the triangles whose circumcircle contains the point
            const badTriangles = [];
            for (const tri of triangles) {
                if (tri.isPointInCircumcircle(point)) {
                    badTriangles.push(tri);
                }
            }
            if (badTriangles.length === 0) {
                continue;
            }
            const badSet = new Set(badTriangles);
            
            // The boundary of the polygonal hole is the set of edges that
            // belong to exactly one bad triangle
            const boundaryEdges = [];
            const toggleEdge = (a, b) => {
                const index = boundaryEdges.findIndex(
                    edge => (edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a)
                );
                if (index >= 0) {
                    boundaryEdges.splice(index, 1);
                } else {
                    boundaryEdges.push([a, b]);
                }
            };
            for (const tri of badTriangles) {
                toggleEdge(tri.p1, tri.p2);
                toggleEdge(tri.p2, tri.p3);
                toggleEdge(tri.p3, tri.p1);
            }
            
            // Remove the bad triangles and retriangulate the hole with
            // the inserted point
            triangles = triangles.filter(tri => !badSet.has(tri));
            for (const [a, b] of boundaryEdges) {
                triangles.push(new Triangle(a, b, point));
            }
        }
        
        // Keep only the triangles that do not use a super-triangle vertex
        return triangles.filter(tri =>
            !superPoints.includes(tri.p1) &&
            !superPoints.includes(tri.p2) &&
            !superPoints.includes(tri.p3)
        );
    }

    /**
     * Calculate and draw the Delaunay triangulation
     */
    calculateAndDraw() {
        // Clear previous triangle lines
        this.clearTriangleMeshes();
        
        // Calculate the triangulation if we have enough points
        const points = this.pointManager.getPoints();
        if (points.length >= 3) {
            this.triangles = this.findDelaunayTriangles();
            this.buildEdges();
            this.createLineSegments();
        }
    }

    /**
     * Collect the unique edges of the current triangles (adjacent
     * triangles share edges, so drawing triangle by triangle would draw
     * every inner edge twice). Each edge keeps the color of the first
     * triangle that used it.
     */
    buildEdges() {
        this.edges = [];
        const seen = new Set();
        for (const triangle of this.triangles) {
            const color = ColorUtils.generatePastelColor(triangle.getColorSeed());
            const vertices = [triangle.p1, triangle.p2, triangle.p3];
            for (let i = 0; i < 3; i++) {
                const a = vertices[i];
                const b = vertices[(i + 1) % 3];
                // Canonical key, so the same edge always matches
                const key = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    this.edges.push({ a: a, b: b, color: color });
                }
            }
        }
    }

    /**
     * Create the single LineSegments object that draws all edges, with a
     * per-vertex color attribute for the per-edge colors
     */
    createLineSegments() {
        if (this.edges.length === 0) {
            return;
        }
        
        // Position and color arrays (2 vertices per edge)
        const positions = new Float32Array(this.edges.length * 6);
        const colors = new Float32Array(this.edges.length * 6);
        for (let i = 0, offset = 0; i < this.edges.length; i++, offset += 6) {
            const color = this.edges[i].color;
            const r = ((color >> 16) & 0xFF) / 255;
            const g = ((color >> 8) & 0xFF) / 255;
            const b = (color & 0xFF) / 255;
            colors[offset] = r;
            colors[offset + 1] = g;
            colors[offset + 2] = b;
            colors[offset + 3] = r;
            colors[offset + 4] = g;
            colors[offset + 5] = b;
        }
        
        this.lineGeometry = new THREE.BufferGeometry();
        this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.writeEdgePositions();
        
        this.lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: DisplayConstants.LINE_THICKNESS
        });
        
        this.line = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
        this.scene.add(this.line);
    }

    /**
     * Write the current point positions into the position attribute
     * (in place, without allocating new arrays or attributes)
     */
    writeEdgePositions() {
        const positions = this.lineGeometry.attributes.position.array;
        for (let i = 0, offset = 0; i < this.edges.length; i++, offset += 6) {
            const edge = this.edges[i];
            positions[offset] = edge.a.position.x;
            positions[offset + 1] = edge.a.position.y;
            positions[offset + 2] = this.Z_OFFSET;
            positions[offset + 3] = edge.b.position.x;
            positions[offset + 4] = edge.b.position.y;
            positions[offset + 5] = this.Z_OFFSET;
        }
        this.lineGeometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update triangle vertex positions (to follow point movements)
     */
    updateTrianglePositions() {
        if (this.line) {
            this.writeEdgePositions();
        }
    }

    /**
     * Clear previous triangle lines
     */
    clearTriangleMeshes() {
        if (this.line) {
            this.scene.remove(this.line);
            this.lineGeometry.dispose();
            this.lineMaterial.dispose();
            this.line = null;
            this.lineGeometry = null;
            this.lineMaterial = null;
        }
        this.edges = [];
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        this.clearTriangleMeshes();
        this.triangles = [];
    }
}
