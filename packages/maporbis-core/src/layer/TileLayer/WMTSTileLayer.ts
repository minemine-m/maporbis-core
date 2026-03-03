import { Camera } from "three";
// import { ISource } from "../../sources";
// import { IProjection } from "../../projection";
import { RasterTileLayer, RasterTileLayerOptions } from "./RasterTileLayer";
import { CompositeTileLoader, ICompositeLoader } from "../../loaders";

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
export class WMTSTileLayer extends RasterTileLayer {
    /**
     * Layer type identifier.
     * 图层类型标识符。
     * @readonly
     */
    public readonly layerType: string = "wmts";

    private _layerName: string;
    private _style: string;
    private _matrixSet: string;

    /**
     * Create a new WMTSTileLayer instance.
     * 创建一个新的 WMTSTileLayer 实例。
     * 
     * @param id Unique layer identifier. 图层唯一标识符。
     * @param options Layer configuration options. 图层配置选项。
     */
    constructor(
        id: string,
        options: WMTSTileLayerOptions
    ) {
        super(id, options);

        this._layerName = options.layerName;
        this._style = options.style || "default";
        this._matrixSet = options.matrixSet || "GoogleMapsCompatible";
    }

    /**
     * Get WMTS layer name.
     * 获取WMTS图层名称。
     */
    public get layerName(): string {
        return this._layerName;
    }

    /**
     * Get WMTS style.
     * 获取WMTS样式。
     */
    public get style(): string {
        return this._style;
    }

    /**
     * Get WMTS matrix set.
     * 获取WMTS矩阵集。
     */
    public get matrixSet(): string {
        return this._matrixSet;
    }

    /**
     * Create tile loader.
     * 创建瓦片加载器。
     * 
     * @returns {ICompositeLoader} The created tile loader. 创建的瓦片加载器。
     * @protected
     */
    protected createLoader(): ICompositeLoader {
        const loader = new CompositeTileLoader();
        if (Array.isArray(this.source)) {
            loader.imgSource = this.source;
        } else {
            loader.imgSource = [this.source];
        }
        return loader;
    }

    /**
     * Update layer.
     * 更新图层。
     * 
     * @param camera The camera used for rendering. 用于渲染的相机。
     */
    public update(camera: Camera): void {
        if (!this.loader) {
            // console.warn("⚠️ Loader not ready, skipping update Loader未就绪，跳过更新");
            return;
        }
        super.update(camera);
    }
}

// Usage example:
// 使用示例：
// Usage before refactor:
// 重构前的用法：
// new WMTSTileLayer(
//     "wmts-base",
//     source,
//     projection,
//     "landsat8",
//     "default",
//     "EPSG:3857",
//     0, 16
// );

// Usage after refactor:
// 重构后的用法：
// new WMTSTileLayer("wmts-base", {
//     source: source,
//     projection: projection,
//     layerName: "landsat8",
//     style: "default",
//     matrixSet: "EPSG:3857",
//     minLevel: 0,
//     maxLevel: 16,
//     // Other optional configurations...
//     // 其他可选配置...
// });
