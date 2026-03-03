import { IGeometryData } from "./GeometryTypes";
/**
 * RTIN (Right-Triangulated Irregular Networks) based terrain mesh builder.
 * 基于 RTIN 的地形网格构建器。
 *
 * @description
 * Implements the Martini algorithm for fast terrain mesh generation.
 * 实现 Martini 算法以快速生成地形网格。
 */
export declare class TerrainMeshBuilder {
    /**
     * Default grid size (257).
     * 默认网格大小 (257)。
     */
    static readonly DEFAULT_GRID_SIZE = 257;
    private readonly gridSize;
    private readonly numTriangles;
    private readonly numParentTriangles;
    private readonly indices;
    private readonly coords;
    /**
     * Create a new TerrainMeshBuilder.
     * 创建一个新的 TerrainMeshBuilder。
     *
     * @param gridSize Grid size, must be 2^k + 1. 网格大小，必须是 2^k + 1。
     */
    constructor(gridSize?: number);
    /**
     * Precompute triangle coordinates.
     * 预计算三角形坐标。
     * @param tileSize Tile size (gridSize - 1)
     */
    private precomputeCoords;
    /**
     * Process terrain data to generate mesh.
     * 处理地形数据以生成网格。
     *
     * @param terrainData Terrain height data. 地形高度数据。
     * @param maxError Maximum allowed error. 最大允许误差。
     * @returns Geometry data. 几何体数据。
     */
    build(terrainData: Float32Array, maxError?: number): IGeometryData;
    /**
     * Calculate errors for all triangles.
     * 计算所有三角形的误差。
     */
    private calculateErrors;
    /**
     * Generate geometry from error map.
     * 从误差图生成几何体。
     */
    private generateGeometry;
}
