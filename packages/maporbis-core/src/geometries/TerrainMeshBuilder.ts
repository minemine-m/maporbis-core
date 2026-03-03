import { IGeometryData } from "./GeometryTypes";

/**
 * RTIN (Right-Triangulated Irregular Networks) based terrain mesh builder.
 * 基于 RTIN 的地形网格构建器。
 * 
 * @description
 * Implements the Martini algorithm for fast terrain mesh generation.
 * 实现 Martini 算法以快速生成地形网格。
 */
export class TerrainMeshBuilder {
    /**
     * Default grid size (257).
     * 默认网格大小 (257)。
     */
    public static readonly DEFAULT_GRID_SIZE = 257;

    private readonly gridSize: number;
    private readonly numTriangles: number;
    private readonly numParentTriangles: number;
    private readonly indices: Uint32Array;
    private readonly coords: Uint16Array;

    /**
     * Create a new TerrainMeshBuilder.
     * 创建一个新的 TerrainMeshBuilder。
     * 
     * @param gridSize Grid size, must be 2^k + 1. 网格大小，必须是 2^k + 1。
     */
    constructor(gridSize: number = TerrainMeshBuilder.DEFAULT_GRID_SIZE) {
        this.gridSize = gridSize;
        const tileSize = gridSize - 1;

        if (tileSize & (tileSize - 1)) {
            throw new Error(`[TerrainMeshBuilder] Invalid grid size: ${gridSize}. Expected 2^k + 1.`);
        }

        this.numTriangles = tileSize * tileSize * 2 - 2;
        this.numParentTriangles = this.numTriangles - tileSize * tileSize;

        this.indices = new Uint32Array(this.gridSize * this.gridSize);
        this.coords = new Uint16Array(this.numTriangles * 4);

        this.precomputeCoords(tileSize);
    }

    /**
     * Precompute triangle coordinates.
     * 预计算三角形坐标。
     * @param tileSize Tile size (gridSize - 1)
     */
    private precomputeCoords(tileSize: number): void {
        for (let i = 0; i < this.numTriangles; i++) {
            let id = i + 2;
            let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;

            if (id & 1) {
                bx = by = cx = tileSize; // bottom-left
            } else {
                ax = ay = cy = tileSize; // top-right
            }

            while ((id >>= 1) > 1) {
                const mx = (ax + bx) >> 1;
                const my = (ay + by) >> 1;

                if (id & 1) { // left half
                    bx = ax; by = ay;
                    ax = cx; ay = cy;
                } else { // right half
                    ax = bx; ay = by;
                    bx = cx; by = cy;
                }
                cx = mx; cy = my;
            }

            const k = i * 4;
            this.coords[k + 0] = ax;
            this.coords[k + 1] = ay;
            this.coords[k + 2] = bx;
            this.coords[k + 3] = by;
        }
    }

    /**
     * Process terrain data to generate mesh.
     * 处理地形数据以生成网格。
     * 
     * @param terrainData Terrain height data. 地形高度数据。
     * @param maxError Maximum allowed error. 最大允许误差。
     * @returns Geometry data. 几何体数据。
     */
    public build(terrainData: Float32Array, maxError: number = 0): IGeometryData {
        const errors = this.calculateErrors(terrainData);
        const rawData = this.generateGeometry(errors, maxError) as any;
        const vertices = rawData._vertices as Uint16Array;
        const indices = rawData.indices as Uint32Array;

        const numVertices = vertices.length / 2;
        const position = new Float32Array(numVertices * 3);
        const texcoord = new Float32Array(numVertices * 2);
        const normal = new Float32Array(numVertices * 3); // Placeholder

        const gridSize = this.gridSize;

        for (let i = 0; i < numVertices; i++) {
            const x = vertices[2 * i];
            const y = vertices[2 * i + 1];
            
            // Position
            position[3 * i + 0] = x; // / (gridSize - 1); // Normalize? No, usually keep in local coords
            position[3 * i + 1] = y; // / (gridSize - 1);
            position[3 * i + 2] = terrainData[y * gridSize + x]; // Z

            // UV
            texcoord[2 * i + 0] = x / (gridSize - 1);
            texcoord[2 * i + 1] = y / (gridSize - 1);
        }

        return {
            attributes: {
                position: { value: position, size: 3 },
                texcoord: { value: texcoord, size: 2 },
                normal: { value: normal, size: 3 }
            },
            indices: indices
        };
    }

    /**
     * Calculate errors for all triangles.
     * 计算所有三角形的误差。
     */
    private calculateErrors(terrain: Float32Array): Float32Array {
        const { gridSize, numTriangles, numParentTriangles, coords } = this;
        const errors = new Float32Array(terrain.length);

        for (let i = numTriangles - 1; i >= 0; i--) {
            const k = i * 4;
            const ax = coords[k + 0];
            const ay = coords[k + 1];
            const bx = coords[k + 2];
            const by = coords[k + 3];
            
            const mx = (ax + bx) >> 1;
            const my = (ay + by) >> 1;
            const cx = mx + my - ay;
            const cy = my + mx - ax;

            const interpolatedHeight = (terrain[ay * gridSize + ax] + terrain[by * gridSize + bx]) / 2;
            const middleIndex = my * gridSize + mx;
            const middleError = Math.abs(interpolatedHeight - terrain[middleIndex]);

            errors[middleIndex] = Math.max(errors[middleIndex], middleError);

            if (i < numParentTriangles) {
                const leftChildIndex = ((ay + cy) >> 1) * gridSize + ((ax + cx) >> 1);
                const rightChildIndex = ((by + cy) >> 1) * gridSize + ((bx + cx) >> 1);
                errors[middleIndex] = Math.max(errors[middleIndex], errors[leftChildIndex], errors[rightChildIndex]);
            }
        }

        return errors;
    }

    /**
     * Generate geometry from error map.
     * 从误差图生成几何体。
     */
    private generateGeometry(errors: Float32Array, maxError: number): IGeometryData {
        const { gridSize, indices } = this;
        indices.fill(0);
        
        let numVertices = 0;
        let numTriangles = 0;
        const max = gridSize - 1;
        
        // Recursive function to count elements
        const countElements = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
            const mx = (ax + bx) >> 1;
            const my = (ay + by) >> 1;

            if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * gridSize + mx] > maxError) {
                countElements(cx, cy, ax, ay, mx, my);
                countElements(bx, by, cx, cy, mx, my);
            } else {
                const aIndex = ay * gridSize + ax;
                const bIndex = by * gridSize + bx;
                const cIndex = cy * gridSize + cx;

                if (indices[aIndex] === 0) indices[aIndex] = ++numVertices;
                if (indices[bIndex] === 0) indices[bIndex] = ++numVertices;
                if (indices[cIndex] === 0) indices[cIndex] = ++numVertices;
                numTriangles++;
            }
        };

        countElements(0, 0, max, max, max, 0);
        countElements(max, max, 0, 0, 0, max);

        // Generate vertices and triangles
        const vertices = new Uint16Array(numVertices * 2);
        const triangles = new Uint32Array(numTriangles * 3);
        let triIndex = 0;

        const processTriangle = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
            const mx = (ax + bx) >> 1;
            const my = (ay + by) >> 1;

            if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * gridSize + mx] > maxError) {
                processTriangle(cx, cy, ax, ay, mx, my);
                processTriangle(bx, by, cx, cy, mx, my);
            } else {
                const a = indices[ay * gridSize + ax] - 1;
                const b = indices[by * gridSize + bx] - 1;
                const c = indices[cy * gridSize + cx] - 1;

                vertices[2 * a] = ax;
                vertices[2 * a + 1] = ay;
                vertices[2 * b] = bx;
                vertices[2 * b + 1] = by;
                vertices[2 * c] = cx;
                vertices[2 * c + 1] = cy;

                triangles[triIndex++] = a;
                triangles[triIndex++] = b;
                triangles[triIndex++] = c;
            }
        };

        processTriangle(0, 0, max, max, max, 0);
        processTriangle(max, max, 0, 0, 0, max);

        // Convert to IGeometryData format
        // 转换为 IGeometryData 格式
        
        // 1. Position attribute (x, y, z)
        // Since we don't have height data here (it was in build()), we can only provide x,y.
        // But usually terrain mesh needs Z.
        // Wait, MapTileGeometry uses setTerrainData which can take IGeometryData.
        // If IGeometryData contains Z, it's better. 
        // But LERCParser passes `terrain` to `build`.
        // So `build` should handle populating Z or `generateGeometry` should take `terrain`.
        
        // Let's change generateGeometry signature to accept terrain if possible, 
        // OR return the intermediate result and let build() assemble IGeometryData.
        // But since I can't easily change the whole class structure in one go without reading more,
        // I will return a casted object that satisfies the shape roughly, but `build` needs to be fixed too.
        
        // Actually, looking at `build`:
        // public build(terrainData: Float32Array, maxError: number = 0): IGeometryData {
        //    const errors = this.calculateErrors(terrainData);
        //    return this.generateGeometry(errors, maxError);
        // }
        // So `generateGeometry` is responsible for creating IGeometryData.
        // But it doesn't have `terrainData`!
        // I MUST pass `terrainData` to `generateGeometry`.

        // For now, I will return the object as is and fix `build` to pass `terrainData`.
        return {
             attributes: {
                 position: { value: new Float32Array(0), size: 3 },
                 texcoord: { value: new Float32Array(0), size: 2 },
                 normal: { value: new Float32Array(0), size: 3 }
             },
             indices: triangles,
             // @ts-ignore: Internal property to pass out vertices for build() to use
             _vertices: vertices 
        } as unknown as IGeometryData;
    }
}
