import { ISource } from "../sources";
/**
 * Loader Utilities Class
 * @class LoaderUtils
 */
export declare class LoaderUtils {
    /**
     * 计算图片裁剪区域
     * @param clipBounds 裁剪边界 [minx, miny, maxx, maxy] (0-1)
     * @param targetSize 目标尺寸
     * @returns {sx, sy, sw, sh}
     */
    static getBoundsCoord(clipBounds: [number, number, number, number], targetSize: number): {
        sx: number;
        sy: number;
        sw: number;
        sh: number;
    };
    /**
     * 获取安全瓦片 URL 和裁剪边界
     * @description 如果请求级别超过最大级别，则回退到最大级别并计算裁剪边界
     */
    static getSafeTileUrlAndBounds(source: ISource, x: number, y: number, z: number): {
        url: string | undefined;
        clipBounds: [number, number, number, number];
    };
    private static getMaxLevelTileAndBounds;
}
