import { MapTileGeometry } from "../geometries";
import { AbstractGeometryLoader } from "./AbstractGeometryLoader";
import { SourceLoadContext } from "./LoaderInterfaces";
/**
 * Mapbox RGB 地形加载器
 * @class MapboxRGBLoader
 */
export declare class MapboxRGBLoader extends AbstractGeometryLoader {
    readonly info: {
        version: string;
        description: string;
    };
    readonly dataType = "terrain-rgb";
    private imageLoader;
    private workerPool;
    constructor();
    /**
     * 执行加载
     * @param url
     * @param context
     */
    protected performLoad(url: string, context: SourceLoadContext): Promise<MapTileGeometry>;
    /**
     * 提取子图像数据
     * @param image 源图像
     * @param bounds 裁剪边界
     * @param targetSize 目标尺寸
     */
    private extractSubImageData;
}
