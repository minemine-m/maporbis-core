import { AbstractProjection } from "./AbstractProjection";
/**
 * WGS84 经纬度直投 (EPSG:4326)
 * @class WGS84Projection
 * @extends AbstractProjection
 * @description 简单的经纬度线性映射，x = lon, y = lat (乘以比例因子)
 */
export class WGS84Projection extends AbstractProjection {
    ID = "4326";
    // 缩放因子：将度数映射到较大的整数空间，原代码使用 100 作为因子
    static SCALE_FACTOR = 100.0;
    mapWidth = 360 * WGS84Projection.SCALE_FACTOR; // 36000
    mapHeight = 180 * WGS84Projection.SCALE_FACTOR; // 18000
    mapDepth = 1;
    constructor(centralMeridian = 0) {
        super(centralMeridian);
    }
    forward(longitude, latitude) {
        return {
            x: (longitude - this.centralMeridian) * WGS84Projection.SCALE_FACTOR,
            y: latitude * WGS84Projection.SCALE_FACTOR
        };
    }
    inverse(x, y) {
        return {
            lon: x / WGS84Projection.SCALE_FACTOR + this.centralMeridian,
            lat: y / WGS84Projection.SCALE_FACTOR
        };
    }
}
