import { AbstractProjection } from "./AbstractProjection";
/**
 * Web墨卡托投影 (EPSG:3857)
 * @class WebMercatorProjection
 * @extends AbstractProjection
 */
export class WebMercatorProjection extends AbstractProjection {
    ID = "3857";
    // private static readonly EARTH_RADIUS = 6378137; // 修正为标准WGS84长半轴，原代码 6378000 可能是简化
    // 保持原代码的常数以确保完全兼容
    static LEGACY_EARTH_RADIUS = 6378000;
    mapWidth = 2 * Math.PI * WebMercatorProjection.LEGACY_EARTH_RADIUS;
    mapHeight = this.mapWidth;
    mapDepth = 1;
    constructor(centralMeridian = 0) {
        super(centralMeridian);
    }
    forward(longitude, latitude) {
        const d2r = Math.PI / 180;
        const r = WebMercatorProjection.LEGACY_EARTH_RADIUS;
        const lonRad = (longitude - this.centralMeridian) * d2r;
        const latRad = latitude * d2r;
        const x = r * lonRad;
        const y = r * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
        return { x, y };
    }
    inverse(x, y) {
        const r2d = 180 / Math.PI;
        const r = WebMercatorProjection.LEGACY_EARTH_RADIUS;
        let lon = (x / r) * r2d + this.centralMeridian;
        // 归一化经度到 -180 ~ 180 (虽然原代码只是 -360，这里做更健壮的处理)
        if (lon > 180)
            lon -= 360;
        if (lon < -180)
            lon += 360;
        const latRad = (2 * Math.atan(Math.exp(y / r)) - Math.PI / 2);
        const lat = latRad * r2d;
        return { lon, lat };
    }
}
