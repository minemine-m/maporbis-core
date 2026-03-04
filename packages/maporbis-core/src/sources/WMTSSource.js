import { TileSource } from "./TileSource";
import { interpolate } from "../utils";
/**
 * WMTS标准瓦片数据源
 * @description 实现OGC WMTS 1.0.0标准的瓦片数据源
 * @extends TileSource
 */
export class WMTSSource extends TileSource {
    /**
     * 最小缩放级别
     * @default 2
     */
    minLevel = 2;
    /**
     * 最大缩放级别
     * @default 24
     */
    maxLevel = 24;
    // public dataType: string = "VectorTile";
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options) {
        super({
            ...options,
            url: options.urlTemplate,
            isTMS: options.isTMS || false
        });
    }
    /**
     * 获取瓦片URL
     * @param x 瓦片X坐标（瓦片列号）
     * @param y 瓦片Y坐标（瓦片行号）
     * @param z 缩放级别（瓦片矩阵级别）
     * @returns 完整的瓦片请求URL
     *
     * @description
     * 根据WMTS规范生成瓦片请求URL，自动处理：
     * - 坐标轴朝向（TMS/Y轴反向）
     * - 变量替换（支持多种WMTS参数命名）
     *
     * 支持的URL模板变量：
     * - {x}: 瓦片X坐标
     * - {y}: 瓦片Y坐标（自动处理TMS反转）
     * - {z}: 缩放级别
     * - {tileMatrix}: 瓦片矩阵级别
     * - {tileRow}: 瓦片行号（自动处理TMS反转）
     * - {tileCol}: 瓦片列号
     */
    getUrl(x, y, z) {
        // 处理TMS坐标反转（Y轴从下往上）
        const reverseY = this.isTMS ? Math.pow(2, z) - 1 - y : y;
        // 执行模板变量替换
        return interpolate(this.url, {
            ...this,
            x,
            y: reverseY,
            z,
            tileMatrix: z, // WMTS标准参数
            tileRow: reverseY, // WMTS标准参数
            tileCol: x // WMTS标准参数
        });
    }
}
