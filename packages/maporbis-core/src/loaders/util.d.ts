import { Vector2 } from "three";
import { ISource } from "../sources";
/**
 * GeoJSON 兼容的 WGS84 坐标数组 [Lng, Lat]
 */
type GeoJSONPosition = [number, number];
/**
 * GeoJSON Geometry 的返回类型 (用于 GeoJSON 兼容输出)
 */
interface GeoJSONGeometry {
    type: string;
    coordinates: any;
}
/**
 * Get bounds to clip image
 * @param clipBounds bounds [minx,miny,maxx,maxy],0-1
 * @param targetSize size to scale
 * @returns startX,StarY,width,height
 */
export declare function getBoundsCoord(clipBounds: [number, number, number, number], targetSize: number): {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
};
/**
 * Get url and rect for max level tile
 * to load greater than max level from source,  had to load from max level.
 * 因为瓦片数据并未覆盖所有级别瓦片，如MapBox地形瓦片最高只到15级，如果要显示18级以上瓦片，不能从17级瓦片中获取，只能从15级瓦片里截取一部分
 * @param source
 * @param tile
 * @returns max tile url and bounds in  in maxTile
 */
export declare function getSafeTileUrlAndBounds(source: ISource, x: number, y: number, z: number): {
    url: string | undefined;
    clipBounds: [number, number, number, number];
};
/**
 * 将_Vector2格式的瓦片坐标转换为WGS84经纬度
 * @param {Vector2} vector2 - 包含x, y属性的坐标对象 (x: 1536, y: 4176)
 * @param tileX - 瓦片X坐标
 * @param tileY - 瓦片Y坐标
 * @param zoom - 缩放级别
 * @param extent - 瓦片范围，默认4096
 * @returns GeoJSON 兼容的 WGS84 坐标数组 `[Lng, Lat]`
 */
export declare function vector2ToWGS84(vector2: Vector2, tileX: number, tileY: number, zoom: number, extent?: number): GeoJSONPosition;
/**
 * 转换整个geometry数据结构
 * @param geometryData - MVT解析出的 geometry 数据结构（包含 Vector2 对象）
 * @param tileX - 瓦片X坐标
 * @param tileY - 瓦片Y坐标
 * @param zoom - 缩放级别
 * @returns {Object} 包含 WGS84 坐标数组的 GeoJSON geometry 对象 `{ type: string, coordinates: any }`
 */
export declare function convertGeometryToWGS84(geometryData: any, tileX: number, tileY: number, zoom: number): GeoJSONGeometry;
export {};
