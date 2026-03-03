import { MapTileGeometry } from "../geometries";
import { IGeometryLoader, LoaderMetadata, SourceLoadContext } from "./LoaderInterfaces";
/**
 * 抽象几何体加载器基类
 * @abstract
 */
export declare abstract class AbstractGeometryLoader implements IGeometryLoader<MapTileGeometry> {
    readonly info: LoaderMetadata;
    abstract readonly dataType: string;
    /**
     * 从数据源加载瓦片几何数据
     * @param context 加载上下文
     * @returns Promise<MapTileGeometry>
     */
    load(context: SourceLoadContext): Promise<MapTileGeometry>;
    /**
     * 执行实际加载逻辑 (由子类实现)
     * @param url 数据 URL
     * @param context 加载上下文
     */
    protected abstract performLoad(url: string, context: SourceLoadContext): Promise<MapTileGeometry>;
}
