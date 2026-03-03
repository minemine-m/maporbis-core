/**
 * 投影类型定义
 * @description 目前支持 Web墨卡托 (3857) 和 WGS84 (4326)
 */
export type ProjectionType = "3857" | "4326";

/**
 * 地图投影接口
 * @interface MapProjection
 * @description 定义了地图投影系统必须实现的核心功能，包括坐标转换和尺度信息。
 */
export interface MapProjection {
    /**
     * 投影系统的唯一标识符 (EPSG代码)
     */
    readonly ID: ProjectionType;

    /**
     * 投影坐标系下的地图总宽度 (米)
     */
    readonly mapWidth: number;

    /**
     * 投影坐标系下的地图总高度 (米)
     */
    readonly mapHeight: number;

    /**
     * 投影坐标系下的地图深度 (米)
     */
    readonly mapDepth: number;

    /**
     * 中央经线 (度)
     */
    readonly centralMeridian: number;

    /**
     * 将地理坐标转换为投影坐标
     * @param longitude 经度 (度)
     * @param latitude 纬度 (度)
     * @returns 投影坐标 {x, y} (米)
     */
    forward(longitude: number, latitude: number): { x: number; y: number };

    /**
     * 将投影坐标转换为地理坐标
     * @param x 投影坐标 X (米)
     * @param y 投影坐标 Y (米)
     * @returns 地理坐标 {lon, lat} (度)
     */
    inverse(x: number, y: number): { lon: number; lat: number };

    /**
     * 计算瓦片在考虑中央经线偏移后的 X 坐标
     * @param tileX 原始瓦片 X 坐标
     * @param zoom 瓦片层级
     * @returns 调整后的瓦片 X 坐标
     */
    adjustTileXWithCentralMeridian(tileX: number, zoom: number): number;

    /**
     * 根据经纬度边界获取投影坐标边界
     * @param bounds [minLon, minLat, maxLon, maxLat]
     * @returns [minX, minY, maxX, maxY]
     */
    getProjectedBoundsFromGeoBounds(bounds: [number, number, number, number]): [number, number, number, number];

    /**
     * 获取指定瓦片的投影坐标边界
     * @param x 瓦片 X 坐标
     * @param y 瓦片 Y 坐标
     * @param z 瓦片层级
     * @returns [minX, minY, maxX, maxY]
     */
    getTileProjectedBounds(x: number, y: number, z: number): [number, number, number, number];

    /**
     * 获取指定瓦片的经纬度边界
     * @param x 瓦片 X 坐标
     * @param y 瓦片 Y 坐标
     * @param z 瓦片层级
     * @returns [minLon, minLat, maxLon, maxLat]
     */
    getTileGeoBounds(x: number, y: number, z: number): [number, number, number, number];
}
