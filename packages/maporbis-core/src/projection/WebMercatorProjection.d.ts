import { AbstractProjection } from "./AbstractProjection";
import { ProjectionType } from "./MapProjection";
/**
 * Web墨卡托投影 (EPSG:3857)
 * @class WebMercatorProjection
 * @extends AbstractProjection
 */
export declare class WebMercatorProjection extends AbstractProjection {
    readonly ID: ProjectionType;
    private static readonly LEGACY_EARTH_RADIUS;
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
