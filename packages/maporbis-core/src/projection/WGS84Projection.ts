import { AbstractProjection } from "./AbstractProjection";
import { ProjectionType } from "./MapProjection";

/**
 * WGS84 经纬度直投 (EPSG:4326)
 * @class WGS84Projection
 * @extends AbstractProjection
 * @description 简单的经纬度线性映射，x = lon, y = lat (乘以比例因子)
 */
export class WGS84Projection extends AbstractProjection {
    public readonly ID: ProjectionType = "4326";

    // 缩放因子：将度数映射到较大的整数空间，原代码使用 100 作为因子
    private static readonly SCALE_FACTOR = 100.0;

    public readonly mapWidth = 360 * WGS84Projection.SCALE_FACTOR; // 36000
    public readonly mapHeight = 180 * WGS84Projection.SCALE_FACTOR; // 18000
    public readonly mapDepth = 1;

    public constructor(centralMeridian: number = 0) {
        super(centralMeridian);
    }

    public forward(longitude: number, latitude: number): { x: number; y: number } {
        return {
            x: (longitude - this.centralMeridian) * WGS84Projection.SCALE_FACTOR,
            y: latitude * WGS84Projection.SCALE_FACTOR
        };
    }

    public inverse(x: number, y: number): { lon: number; lat: number } {
        return {
            lon: x / WGS84Projection.SCALE_FACTOR + this.centralMeridian,
            lat: y / WGS84Projection.SCALE_FACTOR
        };
    }
}
