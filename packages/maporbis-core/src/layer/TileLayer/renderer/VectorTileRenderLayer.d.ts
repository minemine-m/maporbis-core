import { Feature } from '../../../feature/Feature';
import { OverlayLayer, OverlayLayerOptions } from '../../OverlayLayer';
import { Tile } from '../../../core/tile';
import { PaintConfig } from '../../../style';
import { PaintRule } from '../../../style/Layerstyle';
export type VectorTileRenderLayerOptions = OverlayLayerOptions<Feature> & {
    /**
     * Paint configuration: Global PaintRule array, applied to all vector layers.
     * 样式配置：全局 PaintRule 数组，应用于所有矢量图层
     */
    paint: PaintRule[];
    tileSize?: number;
    extent?: number;
};
/**
 * Vector Tile Render Layer.
 * 矢量瓦片渲染层
 *
 * @description
 * Responsible for rendering features from vector tiles.
 * Manages the lifecycle of features associated with tiles.
 *
 * 负责渲染矢量瓦片中的要素。
 * 管理与瓦片关联的要素的生命周期。
  * @category Layer
 */
export declare class VectorTileRenderLayer extends OverlayLayer<Feature> {
    private static _textureCache;
    private static _geometryCache;
    private static _materialCache;
    private readonly TILE_SIZE;
    private readonly EXTENT;
    paint: PaintRule[];
    /**
     * Store Features corresponding to each tile for lifecycle management and updates.
     * 存储每个瓦片对应的 Features，用于管理生命周期和更新。
     * @private
     */
    private _tileFeatureMap;
    /**
     * Currently active feature filter (from VectorTileLayer).
     * 当前激活的要素过滤器 (来自 VectorTileLayer)。
     * @private
     */
    private _activeFeatureFilter?;
    constructor(id: string, options: VectorTileRenderLayerOptions);
    /**
     * **Core Method:** Process single tile data, create Features based on global style rules array.
     * **核心方法：** 处理单个瓦片的数据，根据全局样式规则数组创建 Features。
     *
     * @param tile Tile object (contains z, x, y ID). 瓦片对象 (包含 z, x, y ID)。
     * @param data Parsed vector tile data (contains vectorData property). 经过解析的矢量瓦片数据 (包含 vectorData 属性)。
     * @param zoom Current zoom level. 当前缩放级别 (Unused parameter in implementation).
     */
    processTileData(tile: Tile, data: any): void;
    /**
     * Placeholder function: Evaluate if feature properties satisfy filter conditions (needs to implement complex Mapbox GL style spec).
     * 占位函数：评估要素属性是否满足过滤条件 (需要实现复杂的 Mapbox GL 样式规范)。
     *
     * @param filter Filter expression in style rule. 样式规则中的 filter 表达式。
     * @param properties Feature properties object. 要素的属性对象。
     * @param layerName Name of tile layer the current feature belongs to (can be used for filtering). 当前要素所属的瓦片图层名称 (可用于过滤)。
     * @returns {boolean} Whether it matches. 是否匹配。
     */
    private _evaluateFilter;
    /**
     * Hide Features of a tile (do not destroy).
     * Used for tile-hidden event.
     * 隐藏某个瓦片的 Features（并不销毁）。
     * 用于 tile-hidden 事件。
     *
     * @param tileKey Tile identifier. 瓦片标识符。
     */
    hideFeaturesByTileKey(tileKey: string): void;
    /**
     * Completely clean up all Features loaded by a tile.
     * Used for tile-unload event.
     * 彻底清理某个瓦片加载的所有 Feature。
     * 用于 tile-unload 事件。
     *
     * @param tileKey Tile identifier. 瓦片标识符。
     */
    removeFeaturesByTileKey(tileKey: string): void;
    private _removeFeaturesByTileKey;
    /**
     * Create corresponding Feature instance based on GeoJSON type.
     * 根据 GeoJSON 类型创建对应的 Feature 实例
     */
    private _createFeatureInstance;
    private _getAnchorShaderInjection;
    /**
     * Set feature filter function.
     * 设置要素过滤函数
     * @param filter Filter function (feature => boolean)
     */
    setFeatureFilter(filter: any): void;
    clearFeatureFilter(): void;
    setOpacity(opacity: number): void;
    /**
     * Start listening to map update events when Layer is added to Map.
     * Layer 绑定到 Map 时，开始监听地图更新事件
     */
    /**
     * Stop listening when Layer is removed from Map.
     * Layer 从 Map 移除时，取消监听
     */
    /**
     * Map update callback: Force all loaded Features to recalculate their local world coordinates.
     * 地图更新回调：强制所有已加载的 Features 重新计算其局部世界坐标。
     */
    private _onMapUpdate;
    /**
     * Set paint rules and refresh the layer.
     * 设置样式规则并刷新图层。
     * @param paint New paint rules. 新的样式规则。
     */
    setPaint(paint: PaintRule[]): void;
    /**
     * Update symbol for specific rule (by index).
     * 更新指定规则的符号 (按索引)。
     * @param index Rule index to update. 要更新的规则索引。
     * @param symbol New symbol configuration. 新的符号配置。
     */
    updateSymbol(index: number, symbol: PaintConfig): void;
    /**
     * OverlayLayer abstract method implementation.
     * OverlayLayer 抽象方法实现
     */
    protected validateFeature(feature: Feature): boolean;
    /**
     * Three.js render loop update method.
     * Three.js 渲染循环更新方法
     */
    dispose(): void;
    setLineColor(color: string | number): void;
}
