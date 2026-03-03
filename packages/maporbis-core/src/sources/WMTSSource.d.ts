import { SourceOptions, TileSource } from "./TileSource";
/**
 * WMTS数据源配置选项
 * @extends SourceOptions
 */
export type WMTSSourceOptions = SourceOptions & {
    /**
     * 完整的WMTS请求URL模板
     * @description
     * 必须包含{x}{y}{z}或等效参数
     * 支持变量：
     * - {x}: 瓦片X坐标
     * - {y}: 瓦片Y坐标
     * - {z}: 缩放级别
     * - {tileMatrix}: 瓦片矩阵级别（同z）
     * - {tileRow}: 瓦片行号（同y）
     * - {tileCol}: 瓦片列号（同x）
     */
    urlTemplate: string;
    /**
     * 是否使用TMS坐标轴朝向
     * @default false
     * @description
     * true表示Y轴从下往上递增（TMS规范）
     * false表示Y轴从上往下递增（WMTS默认）
     */
    isTMS?: boolean;
};
/**
 * WMTS标准瓦片数据源
 * @description 实现OGC WMTS 1.0.0标准的瓦片数据源
 * @extends TileSource
 */
export declare class WMTSSource extends TileSource {
    /**
     * 最小缩放级别
     * @default 2
     */
    minLevel: number;
    /**
     * 最大缩放级别
     * @default 24
     */
    maxLevel: number;
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options: WMTSSourceOptions);
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
    getUrl(x: number, y: number, z: number): string;
}
