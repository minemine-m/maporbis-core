import { AbstractProjection } from "./AbstractProjection";
/**
 * WGS84 经纬度直投 (EPSG:4326)
 * @class WGS84Projection
 * @extends AbstractProjection
 * @description 简单的经纬度线性映射，x = lon, y = lat (乘以比例因子)
 */
export class WGS84Projection extends AbstractProjection {
    constructor(centralMeridian = 0) {
        super(centralMeridian);
        Object.defineProperty(this, "ID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "4326"
        });
        Object.defineProperty(this, "mapWidth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 360 * WGS84Projection.SCALE_FACTOR
        }); // 36000
        Object.defineProperty(this, "mapHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 180 * WGS84Projection.SCALE_FACTOR
        }); // 18000
        Object.defineProperty(this, "mapDepth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
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
// 缩放因子：将度数映射到较大的整数空间，原代码使用 100 作为因子
Object.defineProperty(WGS84Projection, "SCALE_FACTOR", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 100.0
});
