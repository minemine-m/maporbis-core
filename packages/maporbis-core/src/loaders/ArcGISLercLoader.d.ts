import { MapTileGeometry } from "../geometries";
import { AbstractGeometryLoader } from "./AbstractGeometryLoader";
import { SourceLoadContext } from "./LoaderInterfaces";
/**
 * ArcGIS LERC 地形加载器
 * @class ArcGISLercLoader
 * @description 加载并解析 LERC (Limited Error Raster Compression) 格式的高程数据
 */
export declare class ArcGISLercLoader extends AbstractGeometryLoader {
    readonly info: {
        version: string;
        description: string;
    };
    readonly dataType = "lerc";
    private fileLoader;
    private workerPool;
    constructor();
    /**
     * 执行加载
     * @param url
     * @param context
     */
    protected performLoad(url: string, context: SourceLoadContext): Promise<MapTileGeometry>;
}
