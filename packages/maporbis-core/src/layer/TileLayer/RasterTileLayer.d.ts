import { ICompositeLoader } from "../../loaders";
import { BaseTileLayer, BaseTileLayerOptions } from "./TileLayer";
/**
 * Raster Tile Layer configuration interface.
 * 栅格瓦片图层配置接口
 *
 * @description
 * Configuration options for creating a RasterTileLayer.
 * 用于创建 RasterTileLayer 的配置选项。
  * @category Layer
 */
export interface RasterTileLayerOptions extends BaseTileLayerOptions {
}
/**
 * Raster Tile Layer.
 * 栅格瓦片图层
 *
 * @description
 * General purpose layer for displaying raster imagery.
 * It uses a TileLoader to fetch and display image tiles based on the camera position and zoom level.
 *
 * 用于显示影像数据的通用图层。
 * 它使用 TileLoader 根据相机位置和缩放级别获取并显示图像瓦片。
  * @category Layer
 */
export declare class RasterTileLayer extends BaseTileLayer {
    /**
     * Layer type identifier.
     * 图层类型标识符。
     * @readonly
     */
    readonly layerType: string;
    /**
     * Create a new RasterTileLayer instance.
     * 创建一个新的 RasterTileLayer 实例。
     *
     * @param id Unique layer identifier. 图层唯一标识符。
     * @param options Layer configuration options. 图层配置选项。
     */
    constructor(id: string, options: RasterTileLayerOptions);
    /**
     * Create the tile loader for this layer.
     * 创建此图层的瓦片加载器。
     *
     * @returns {ICompositeLoader} The created tile loader instance. 创建的瓦片加载器实例。
     * @protected
     */
    protected createLoader(): ICompositeLoader;
}
