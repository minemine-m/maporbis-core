import { MapTileGeometry } from "../geometries";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { LoaderUtils } from "./LoaderUtils";
/**
 * 抽象几何体加载器基类
 * @abstract
 */
export class AbstractGeometryLoader {
    constructor() {
        Object.defineProperty(this, "info", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                version: "1.0.0",
                description: "Abstract geometry loader base class",
            }
        });
    }
    /**
     * 从数据源加载瓦片几何数据
     * @param context 加载上下文
     * @returns Promise<MapTileGeometry>
     */
    async load(context) {
        const { source, x, y, z } = context;
        const { url, clipBounds } = LoaderUtils.getSafeTileUrlAndBounds(source, x, y, z);
        if (!url) {
            return new MapTileGeometry();
        }
        // 委托给具体实现，传递更新后的上下文（包含裁剪边界）
        const geometry = await this.performLoad(url, { ...context, bounds: clipBounds });
        // 通知管理器加载完成
        TileLoaderFactory.manager.parseEnd(url);
        return geometry;
    }
}
