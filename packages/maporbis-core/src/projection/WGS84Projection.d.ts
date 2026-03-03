import { AbstractProjection } from "./AbstractProjection";
import { ProjectionType } from "./MapProjection";
/**
 * WGS84 经纬度直投 (EPSG:4326)
 * @class WGS84Projection
 * @extends AbstractProjection
 * @description 简单的经纬度线性映射，x = lon, y = lat (乘以比例因子)
 */
export declare class WGS84Projection extends AbstractProjection {
    readonly ID: ProjectionType;
    private static readonly SCALE_FACTOR;
    readonly mapWidth: number;
    readonly mapHeight: number;
    readonly mapDepth = 1;
    constructor(centralMeridian?: number);
    forward(longitude: number, latitude: number): {
        x: number;
        y: number;
    };
    inverse(x: number, y: number): {
        lon: number;
        lat: number;
    };
}
