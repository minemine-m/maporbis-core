import { IGeometryData } from "./GeometryTypes";
/**
 * 几何体辅助工具类
 * @class GeometryHelper
 */
export declare class GeometryHelper {
    /**
     * 连接多个类型化数组
     * @param arrays 要连接的数组列表
     * @returns 连接后的新数组
     */
    static concatenateTypedArrays<T extends Float32Array | Uint16Array | Uint32Array | Int16Array | Int32Array | Uint8Array | Int8Array>(...arrays: T[]): T;
    /**
     * 计算网格法线
     * @param vertices 顶点位置数组 (x, y, z, ...)
     * @param indices 索引数组
     * @returns 法线数组
     */
    static computeVertexNormals(vertices: Float32Array, indices: Uint16Array | Uint32Array): Float32Array;
    /**
     * 生成规则网格的索引
     * @param rows 行数 (Height)
     * @param cols 列数 (Width)
     */
    static generateGridIndices(rows: number, cols: number): Uint16Array | Uint32Array;
    /**
     * 从 DEM 数据生成几何数据
     * @param demData DEM 高度数据
     * @returns IGeometryData
     */
    static fromDEM(demData: Float32Array): IGeometryData;
}
