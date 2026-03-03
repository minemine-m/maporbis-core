import { Box2, Vector2 } from "three";
import { ISource } from "../sources";

/**
 * Loader Utilities Class
 * @class LoaderUtils
 */
export class LoaderUtils {
    /**
     * 计算图片裁剪区域
     * @param clipBounds 裁剪边界 [minx, miny, maxx, maxy] (0-1)
     * @param targetSize 目标尺寸
     * @returns {sx, sy, sw, sh}
     */
    public static getBoundsCoord(clipBounds: [number, number, number, number], targetSize: number) {
        const sx = Math.floor(clipBounds[0] * targetSize);
        const sy = Math.floor(clipBounds[1] * targetSize);
        const sw = Math.floor((clipBounds[2] - clipBounds[0]) * targetSize);
        const sh = Math.floor((clipBounds[3] - clipBounds[1]) * targetSize);
        return { sx, sy, sw, sh };
    }

    /**
     * 获取安全瓦片 URL 和裁剪边界
     * @description 如果请求级别超过最大级别，则回退到最大级别并计算裁剪边界
     */
    public static getSafeTileUrlAndBounds(
        source: ISource,
        x: number,
        y: number,
        z: number
    ): {
        url: string | undefined;
        clipBounds: [number, number, number, number];
    } {
        if (z < source.minLevel) {
            return {
                url: undefined,
                clipBounds: [0, 0, 1, 1],
            };
        }

        if (z <= source.maxLevel) {
            const url = source._getUrl(x, y, z);
            return {
                url,
                clipBounds: [0, 0, 1, 1],
            };
        }

        // 超过最大级别，计算父级瓦片和裁剪区域
        const maxLevelTileAndBox = this.getMaxLevelTileAndBounds(x, y, z, source.maxLevel);
        const pxyz = maxLevelTileAndBox.parentNO;
        const url = source._getUrl(pxyz.x, pxyz.y, pxyz.z);

        return { url, clipBounds: maxLevelTileAndBox.bounds };
    }

    private static getMaxLevelTileAndBounds(x: number, y: number, z: number, maxLevel: number) {
        const dl = z - maxLevel;
        const parentNO = { x: x >> dl, y: y >> dl, z: z - dl };
        const sep = Math.pow(2, dl);
        const size = Math.pow(0.5, dl);
        const xx = (x % sep) / sep - 0.5 + size / 2;
        const yy = (y % sep) / sep - 0.5 + size / 2;
        const parentCenter = new Vector2(xx, yy);

        const box = new Box2().setFromCenterAndSize(parentCenter, new Vector2(size, size));
        const bounds: [number, number, number, number] = [
            box.min.x + 0.5,
            box.min.y + 0.5,
            box.max.x + 0.5,
            box.max.y + 0.5
        ];

        return { parentNO, bounds };
    }
}
