// import { ISource } from "../../sources";
// import { IProjection } from "../../projection";
import { RasterTileLayer } from "./RasterTileLayer";
import { CompositeTileLoader } from "../../loaders";
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
     * Create a new WMTSTileLayer instance.
     * 创建一个新的 WMTSTileLayer 实例。
     *
     * @param id Unique layer identifier. 图层唯一标识符。
     * @param options Layer configuration options. 图层配置选项。
     */
    constructor(id, options) {
        super(id, options);
        /**
         * Layer type identifier.
         * 图层类型标识符。
         * @readonly
         */
        Object.defineProperty(this, "layerType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "wmts"
        });
        Object.defineProperty(this, "_layerName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_style", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_matrixSet", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._layerName = options.layerName;
        this._style = options.style || "default";
        this._matrixSet = options.matrixSet || "GoogleMapsCompatible";
    }
    /**
     * Get WMTS layer name.
     * 获取WMTS图层名称。
     */
    get layerName() {
        return this._layerName;
    }
    /**
     * Get WMTS style.
     * 获取WMTS样式。
     */
    get style() {
        return this._style;
    }
    /**
     * Get WMTS matrix set.
     * 获取WMTS矩阵集。
     */
    get matrixSet() {
        return this._matrixSet;
    }
    /**
     * Create tile loader.
     * 创建瓦片加载器。
     *
     * @returns {ICompositeLoader} The created tile loader. 创建的瓦片加载器。
     * @protected
     */
    createLoader() {
        const loader = new CompositeTileLoader();
        if (Array.isArray(this.source)) {
            loader.imgSource = this.source;
        }
        else {
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
    update(camera) {
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
