/**
 * 抽象投影基类
 * @abstract
 * @class AbstractProjection
 * @implements {MapProjection}
 * @description 提供了投影系统的基础实现，具体投影算法由子类实现。
 */
export class AbstractProjection {
    _centralMeridian = 0;
    /**
     * 获取中央经线
     */
    get centralMeridian() {
        return this._centralMeridian;
    }
    /**
     * 构造函数
     * @param centralMeridian 中央经线，默认为 0
     */
    constructor(centralMeridian = 0) {
        this._centralMeridian = centralMeridian;
    }
    /**
     * 调整瓦片 X 坐标以适应中央经线
     * @param tileX 原始瓦片 X
     * @param zoom 层级
     */
    adjustTileXWithCentralMeridian(tileX, zoom) {
        const tilesCount = Math.pow(2, zoom);
        // 计算经度偏移对应的瓦片偏移量
        const offset = Math.round((tilesCount / 360) * this._centralMeridian);
        let newX = tileX + offset;
        // 循环处理世界边界
        if (newX >= tilesCount) {
            newX -= tilesCount;
        }
        else if (newX < 0) {
            newX += tilesCount;
        }
        return newX;
    }
    /**
     * 计算瓦片左上角（或左下角，取决于坐标系）的投影坐标
     * 注意：这里假设 y 轴向上，且瓦片索引 y 从上到下（TMS vs XYZ 差异需注意，Three.js通常用 WebGL 坐标系）
     * 但根据原有逻辑：
     * px = (x / n) * w - w/2
     * py = h/2 - (y / n) * h  (这里原代码是 h - ... * h * 2，即 h * (1 - 2y/n) = h - 2yh/n... 待确认)
     * 原代码: py = h - (y / Math.pow(2, z)) * h * 2;  (其中 h = mapHeight / 2)
     * 让我们保持原有逻辑的数学等价性。
     */
    getTileOrigin(x, y, z) {
        const n = Math.pow(2, z);
        const w = this.mapWidth;
        const halfH = this.mapHeight / 2;
        const px = (x / n) * w - w / 2;
        // 原逻辑: py = halfH - (y / n) * halfH * 2
        const py = halfH - (y / n) * this.mapHeight;
        return { x: px, y: py };
    }
    /**
     * 获取经纬度范围的投影坐标边界
     */
    getProjectedBoundsFromGeoBounds(bounds) {
        const [minLon, minLat, maxLon, maxLat] = bounds;
        const min = this.forward(minLon, minLat);
        const max = this.forward(maxLon, maxLat);
        return [min.x, min.y, max.x, max.y];
    }
    /**
     * 获取瓦片的投影坐标边界
     */
    getTileProjectedBounds(x, y, z) {
        // 左上角? 原代码逻辑似乎是左上角
        const p1 = this.getTileOrigin(x, y, z);
        // 右下角? (x+1, y+1)
        const p2 = this.getTileOrigin(x + 1, y + 1, z);
        // 返回 [minX, minY, maxX, maxY]
        // 注意 y 轴方向，如果 y 向下，p2.y < p1.y
        return [
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.max(p1.x, p2.x),
            Math.max(p1.y, p2.y)
        ];
    }
    /**
     * 获取瓦片的经纬度边界
     */
    getTileGeoBounds(x, y, z) {
        const [minX, minY, maxX, maxY] = this.getTileProjectedBounds(x, y, z);
        const p1 = this.inverse(minX, minY);
        const p2 = this.inverse(maxX, maxY);
        return [
            Math.min(p1.lon, p2.lon),
            Math.min(p1.lat, p2.lat),
            Math.max(p1.lon, p2.lon),
            Math.max(p1.lat, p2.lat)
        ];
    }
}
