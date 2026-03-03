import { IGeometryData } from "./GeometryTypes";
export interface IEdgeIndices {
    west: Uint16Array | Uint32Array;
    south: Uint16Array | Uint32Array;
    east: Uint16Array | Uint32Array;
    north: Uint16Array | Uint32Array;
}
/**
 * 几何体裙边生成工具
 * @class GeometrySkirtUtils
 */
export declare class GeometrySkirtUtils {
    /**
     * 为几何体添加裙边 (Skirt)
     * @description 防止地形瓦片之间出现裂缝
     * @param geometryData 原始几何体数据
     * @param skirtHeight 裙边高度 (向下延伸的距离)
     * @param externalEdgeIndices 可选的预计算边缘索引
     */
    static addSkirt(geometryData: IGeometryData, skirtHeight: number, externalEdgeIndices?: IEdgeIndices): IGeometryData;
    /**
     * 从网格索引中提取边界边
     * @param indices 三角形索引
     */
    private static extractBoundaryEdges;
    /**
     * 根据预定义的边缘索引获取边列表
     * @param indices 边缘索引组
     * @param position 顶点位置 (用于排序)
     */
    private static getEdgesFromIndices;
}
