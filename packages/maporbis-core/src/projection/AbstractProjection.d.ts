import { MapProjection, ProjectionType } from "./MapProjection";
/**
 * 抽象投影基类
 * @abstract
 * @class AbstractProjection
 * @implements {MapProjection}
 * @description 提供了投影系统的基础实现，具体投影算法由子类实现。
 */
export declare abstract class AbstractProjection implements MapProjection {
    abstract readonly ID: ProjectionType;
    abstract readonly mapWidth: number;
    abstract readonly mapHeight: number;
    abstract readonly mapDepth: number;
    protected _centralMeridian: number;
    /**
     * 获取中央经线
     */
    get centralMeridian(): number;
    /**
     * 构造函数
     * @param centralMeridian 中央经线，默认为 0
     */
    protected constructor(centralMeridian?: number);
    abstract forward(longitude: number, latitude: number): {
        x: number;
        y: number;
    };
    abstract inverse(x: number, y: number): {
        lon: number;
        lat: number;
    };
    /**
     * 调整瓦片 X 坐标以适应中央经线
     * @param tileX 原始瓦片 X
     * @param zoom 层级
     */
    adjustTileXWithCentralMeridian(tileX: number, zoom: number): number;
    /**
     * 计算瓦片左上角（或左下角，取决于坐标系）的投影坐标
     * 注意：这里假设 y 轴向上，且瓦片索引 y 从上到下（TMS vs XYZ 差异需注意，Three.js通常用 WebGL 坐标系）
     * 但根据原有逻辑：
     * px = (x / n) * w - w/2
     * py = h/2 - (y / n) * h  (这里原代码是 h - ... * h * 2，即 h * (1 - 2y/n) = h - 2yh/n... 待确认)
     * 原代码: py = h - (y / Math.pow(2, z)) * h * 2;  (其中 h = mapHeight / 2)
     * 让我们保持原有逻辑的数学等价性。
     */
    protected getTileOrigin(x: number, y: number, z: number): {
        x: number;
        y: number;
    };
    /**
     * 获取经纬度范围的投影坐标边界
     */
    getProjectedBoundsFromGeoBounds(bounds: [number, number, number, number]): [number, number, number, number];
    /**
     * 获取瓦片的投影坐标边界
     */
    getTileProjectedBounds(x: number, y: number, z: number): [number, number, number, number];
    /**
     * 获取瓦片的经纬度边界
     */
    getTileGeoBounds(x: number, y: number, z: number): [number, number, number, number];
}
