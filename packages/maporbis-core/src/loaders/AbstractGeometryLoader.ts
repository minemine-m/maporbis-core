import { MapTileGeometry } from "../geometries";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { IGeometryLoader, LoaderMetadata, SourceLoadContext } from "./LoaderInterfaces";
import { LoaderUtils } from "./LoaderUtils";

/**
 * 抽象几何体加载器基类
 * @abstract
 */
export abstract class AbstractGeometryLoader implements IGeometryLoader<MapTileGeometry> {
    public readonly info: LoaderMetadata = {
        version: "1.0.0",
        description: "Abstract geometry loader base class",
    };

    public abstract readonly dataType: string;

    /**
     * 从数据源加载瓦片几何数据
     * @param context 加载上下文
     * @returns Promise<MapTileGeometry>
     */
    public async load(context: SourceLoadContext): Promise<MapTileGeometry> {
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

    /**
     * 执行实际加载逻辑 (由子类实现)
     * @param url 数据 URL
     * @param context 加载上下文
     */
    protected abstract performLoad(url: string, context: SourceLoadContext): Promise<MapTileGeometry>;
}
