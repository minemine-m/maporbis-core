import { IGeometryData } from "../../geometries/GeometryTypes";
/**
 * DEM Data Structure
 * DEM 数据结构
 */
export type DEMType = {
    array: Float32Array;
    width: number;
    height: number;
};
/**
 * LERC Format Parser
 * LERC 格式解析器
 *
 * @description
 * Parses LERC compressed terrain data and generates mesh geometry using TerrainMeshBuilder.
 * 解析 LERC 压缩地形数据并使用 TerrainMeshBuilder 生成网格几何体。
 */
export declare class LERCParser {
    /**
     * Parse LERC data to geometry
     * 解析 LERC 数据为几何体
     *
     * @param buffer LERC data buffer
     * @param z Zoom level
     * @param clipBounds Clip bounds
     * @returns Geometry data
     */
    static parse(buffer: ArrayBuffer, z: number, clipBounds: [number, number, number, number]): IGeometryData;
    /**
     * Decode Lerc data
     * 解码 Lerc 数据
     */
    private static decode;
    /**
     * Get sub-DEM data
     * 获取子 DEM 数据
     */
    private static getSubDEM;
    /**
     * Helper to calculate clip coordinates
     */
    private static getBoundsCoord;
}
