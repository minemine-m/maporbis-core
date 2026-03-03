import { Camera } from "three";
import { ISource } from "../../sources";
import { MapProjection as IProjection } from "../../projection";
import { ITileLayer } from "./interfaces/ITileLayer";
import { Tile } from "../../core/tile";
import { ICompositeLoader } from "../../loaders";
import { Layer, LayerOptions } from "../Layer";
/**
 * Tile Layer configuration interface.
 * 瓦片图层配置接口
 *
 * @description
 * Base configuration options for all tile layers.
 * 所有瓦片图层的基本配置选项。
  * @category Layer
 */
export interface BaseTileLayerOptions extends LayerOptions {
    /**
     * Data source(s) for the layer.
     * 图层数据源。
     */
    source: ISource | ISource[];
    /**
     * Projection system used by the layer.
     * 图层使用的投影系统。
     */
    projection: IProjection;
    /**
     * Minimum zoom level.
     * 最小缩放级别。
     * @default 2
     */
    minLevel?: number;
    /**
     * Maximum zoom level.
     * 最大缩放级别。
     * @default 19
     */
    maxLevel?: number;
    /**
     * Level of Detail (LOD) threshold.
     * 细节层次（LOD）阈值。
     * @default 1
     */
    LODThreshold?: number;
    /**
     * Layer opacity (0-1).
     * 图层透明度 (0-1)。
     * @default 1
     */
    opacity?: number;
    /**
     * Whether the layer receives shadows.
     * 图层是否接收阴影。
     * @default false
     */
    receiveShadow?: boolean;
}
/**
 * Tile Layer abstract base class.
 * 瓦片图层抽象基类
 *
 * @description
 * Provides basic implementation skeleton for tile-based layers.
 * It handles the creation and management of the tile tree, LOD (Level of Detail) updates, and visibility.
 *
 * 提供基于瓦片的图层的基本实现骨架。
 * 它处理瓦片树的创建和管理、LOD（细节层次）更新和可见性。
 *
 * @abstract
 * @extends Layer
 * @implements ITileLayer
 * @category Layer
 */
export declare abstract class BaseTileLayer extends Layer implements ITileLayer {
    readonly layerId: string;
    /**
     * Whether the layer is a tile layer.
     * 是否为瓦片图层。
     * @readonly
     */
    readonly isTileLayer = true;
    /**
     * Layer type identifier.
     * 图层类型标识符。
     * @readonly
     */
    readonly layerType: string;
    /**
     * Whether it is a base layer (background map).
     * 是否是底图。
     * @readonly
     */
    readonly isBaseLayer = false;
    protected _enabled: boolean;
    protected _visible: boolean;
    /**
     * Root tile instance.
     * 根瓦片实例。
     * @protected
     */
    protected _rootTile: Tile;
    /**
     * Loader instance.
     * 加载器实例。
     * @protected
     */
    protected _loader: ICompositeLoader;
    private _LODThreshold;
    /**
     * Whether it is a scene layer (e.g. 3D objects).
     * 是否是场景图层。
     * @readonly
     */
    readonly isSceneLayer = false;
    /**
     * Layer opacity.
     * 图层透明度。
     */
    opacity: number;
    /**
     * Layer data source(s).
     * 图层数据源。
     * @readonly
     */
    readonly source: ISource | ISource[];
    /**
     * Layer projection.
     * 图层投影。
     * @readonly
     */
    readonly projection: IProjection;
    /**
     * Minimum zoom level.
     * 最小缩放级别。
     */
    minLevel: number;
    /**
     * Maximum zoom level.
     * 最大缩放级别。
     */
    maxLevel: number;
    /**
     * Create a new BaseTileLayer instance.
     * 创建一个新的 BaseTileLayer 实例。
     *
     * @param layerId Unique layer identifier. 图层唯一标识符。
     * @param options Layer configuration options. 图层配置选项。
     */
    constructor(layerId: string, options: BaseTileLayerOptions);
    /**
     * Get LOD threshold.
     * 获取LOD阈值
     *
     * @returns {number} The current LOD threshold. 当前 LOD 阈值。
     */
    get LODThreshold(): number;
    /**
     * Set LOD threshold.
     * 设置LOD阈值
     *
     * @param value Recommended value between 1-2. Smaller values mean higher detail. 建议取值1-2之间。值越小细节越高。
     */
    set LODThreshold(value: number);
    /**
     * Get the tile loader instance.
     * 获取瓦片加载器实例。
     */
    get loader(): ICompositeLoader;
    /**
     * Create the tile loader for this layer.
     * 创建此图层的瓦片加载器。
     *
     * @returns {ICompositeLoader} The created tile loader instance. 创建的瓦片加载器实例。
     * @protected
     * @abstract
     */
    protected abstract createLoader(): ICompositeLoader;
    /**
     * Get layer enabled state.
     * 获取图层启用状态。
     */
    get enabled(): boolean;
    /**
     * Set layer enabled state.
     * 设置图层启用状态。
     *
     * @param value True to enable, false to disable. True 启用，False 禁用。
     */
    set enabled(value: boolean);
    /**
     * Get layer internal visibility.
     * 获取图层内部可见性。
     *
     * @description
     * Combines layer specific visibility with base class visibility.
     * 结合图层特定可见性和基类可见性。
     */
    get ivisible(): boolean;
    /**
     * Set layer internal visibility.
     * 设置图层内部可见性。
     */
    set ivisible(value: boolean);
    /**
     * Update the layer.
     * 更新图层。
     *
     * @description
     * Called every frame to update the tile tree based on the camera.
     * 每帧调用以根据相机更新瓦片树。
     *
     * @param camera The camera used for rendering. 用于渲染的相机。
     */
    update(camera: Camera): void;
    private _debugTileTree;
    /**
     * Get LOD threshold - Missing function implementation.
     * 获取LOD阈值 - 缺失的函数实现
     * @description Control threshold for tile detail level. 控制瓦片细节级别的阈值
     * @returns {number} LOD threshold, smaller value means easier to trigger subdivision. LOD阈值，值越小越容易触发瓦片细分。
     */
    protected _getLODThreshold(): number;
    /**
     * Get current max loaded tile level (for debugging).
     * 获取当前显示的瓦片层级（用于调试）。
     * @private
     */
    private _getCurrentTileLevel;
    /**
     * Dispose the layer and resources.
     * 销毁图层和资源。
     *
     * @description
     * Removes the root tile and cleans up resources.
     * 移除根瓦片并清理资源。
     */
    dispose(): void;
    /**
     * Reload the layer data.
     * 重新加载图层数据。
     */
    reload(): void;
    /**
     * Set the base elevation of the layer.
     * 设置图层整体抬高。
     *
     * @param elevation The elevation value. 抬高高度。
     */
    setElevation(elevation: number): void;
    /**
     * Raise the layer elevation by a delta.
     * 在现有基础上增加抬高。
     *
     * @param delta The elevation difference to add. 增加的高度。
     */
    raiseElevation(delta: number): void;
    /**
     * Get current layer elevation.
     * 获取当前高程。
     *
     * @returns {number} The current elevation (y-coordinate). 当前高程（y坐标）。
     */
    getElevation(): number;
}
