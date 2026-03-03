import { Camera } from "three";
import { RasterTileLayer, RasterTileLayerOptions } from "./RasterTileLayer";
import { ICompositeLoader } from "../../loaders";
/**
 * WMTS Tile Layer configuration interface.
 * WMTS瓦片图层配置接口
 *
 * @description
 * Configuration options for creating a WMTSTileLayer.
 * 用于创建 WMTSTileLayer 的配置选项。
  * @category Layer
 */
export interface WMTSTileLayerOptions extends RasterTileLayerOptions {
    /**
     * WMTS Layer Name (e.g., 'landsat8').
     * WMTS 图层名称（例如 'landsat8'）。
     */
    layerName: string;
    /**
     * WMTS Style (e.g., 'default').
     * WMTS 样式（例如 'default'）。
     * @default 'default'
     */
    style?: string;
    /**
     * WMTS Matrix Set (e.g., 'EPSG:3857').
     * WMTS 矩阵集（例如 'EPSG:3857'）。
     * @default 'GoogleMapsCompatible'
     */
    matrixSet?: string;
}
/**
 * WMTS Tile Layer.
 * WMTS瓦片图层
 *
 * @description
 * Layer specialized for WMTS (Web Map Tile Service) services.
 * 专门用于WMTS服务的图层。
  * @category Layer
 */
export declare class WMTSTileLayer extends RasterTileLayer {
    /**
     * Layer type identifier.
     * 图层类型标识符。
     * @readonly
     */
    readonly layerType: string;
    private _layerName;
    private _style;
    private _matrixSet;
    /**
     * Create a new WMTSTileLayer instance.
     * 创建一个新的 WMTSTileLayer 实例。
     *
     * @param id Unique layer identifier. 图层唯一标识符。
     * @param options Layer configuration options. 图层配置选项。
     */
    constructor(id: string, options: WMTSTileLayerOptions);
    /**
     * Get WMTS layer name.
     * 获取WMTS图层名称。
     */
    get layerName(): string;
    /**
     * Get WMTS style.
     * 获取WMTS样式。
     */
    get style(): string;
    /**
     * Get WMTS matrix set.
     * 获取WMTS矩阵集。
     */
    get matrixSet(): string;
    /**
     * Create tile loader.
     * 创建瓦片加载器。
     *
     * @returns {ICompositeLoader} The created tile loader. 创建的瓦片加载器。
     * @protected
     */
    protected createLoader(): ICompositeLoader;
    /**
     * Update layer.
     * 更新图层。
     *
     * @param camera The camera used for rendering. 用于渲染的相机。
     */
    update(camera: Camera): void;
}
