import { PlaneGeometry } from "three";
import { IGeometryData } from "./GeometryTypes";
/**
 * 地图瓦片几何体
 * @class MapTileGeometry
 * @extends PlaneGeometry
 * @description 专用于地图瓦片的几何体，支持设置地形数据和自动生成裙边。
 */
export declare class MapTileGeometry extends PlaneGeometry {
    readonly type = "MapTileGeometry";
    /**
     * 设置地形数据
     * @param data 几何体数据 (IGeometryData) 或 DEM 高度图 (Float32Array)
     * @param skirtHeight 裙边高度 (米), 默认 1000
     * @returns this
     */
    setTerrainData(data: IGeometryData | Float32Array, skirtHeight?: number): this;
    /**
     * 更新 Three.js BufferAttributes
     * @param geoData
     */
    private updateThreeJSAttributes;
}
