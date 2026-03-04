import { Group } from "three";
import type { Map } from '../map';
import type { SceneRenderer } from '../renderer';
/**
 * @category Layer
 */
export type RegionOverlayMode = 'overlay' | 'clip';
/**
 * @category Layer
 */
export interface RegionOverlayConfig {
    /**
     * Region overlay ID.
     * Optional, used for subsequent deletion/update.
     * 区域蒙版 ID。
     * 可选，用于后续删除/更新。
     */
    id?: string;
    /**
     * Region geometry (Pass GeoJSON directly).
     * 区域面几何（直接传 GeoJSON）
     */
    geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    /**
     * Region feature (Pass Terra's Polygon/Surface Feature).
     * NOTE: To avoid circular dependencies, type is not strictly constrained here, use any.
     * 区域面要素（直接传 Terra 的 Polygon/Surface Feature）
     * NOTE: 为避免循环依赖，这里不强行约束类型，用 any。
     */
    feature?: any;
    /**
     * Overlay color (used in 'overlay' mode), default '#00FF88'.
     * overlay 模式用，默认 '#00FF88'
     */
    color?: string;
    /**
     * Opacity (used in 'overlay' mode), default 0.3.
     * overlay 模式用，默认 0.3
     */
    opacity?: number;
    /**
     * Overlay mode ('overlay' | 'clip'), default 'overlay'.
     * 'overlay' | 'clip'，默认 'overlay'
     */
    mode?: RegionOverlayMode;
    /**
     * Priority when multiple overlays overlap (Higher value means higher priority).
     * 多个重叠 overlay 时的优先级（数值越大优先级越高）
     */
    zIndex?: number;
}
/**
 * Layer base configuration options.
 * 图层基础配置项
  * @category Layer
 */
export type LayerOptions = {
    /**
     * Attribution information.
     * 版权信息
     */
    attribution?: string;
    /**
     * Whether the layer is visible.
     * 是否可见
     */
    visible?: boolean;
    /**
     * Opacity (0-1).
     * 透明度 (0-1)
     */
    opacity?: number;
    /**
     * Layer z-index.
     * 图层层级
     */
    zIndex?: number;
    /**
     * Whether it is a scene layer.
     * 是否为场景层
     */
    isSceneLayer?: boolean;
    /**
     * Base altitude of the layer.
     * 图层基础高度/海拔
     */
    altitude?: number;
    /**
     * Layer-level depth offset (default value for style depthOffset).
     * 图层级深度偏移（作为样式 depthOffset 的默认值）
     */
    depthOffset?: number;
};
declare const Layer_base: {
    new (...args: any[]): {
        [key: string]: any;
        _handlers?: import("../handler/Handler").default[];
        addHandler(name: string | number, handlerClass: new (arg0: /*elided*/ any) => any): /*elided*/ any;
        removeHandler(name: string | number): /*elided*/ any;
        _clearHandlers(): void;
    };
} & {
    new (...args: any[]): {
        eventClass: import("..").EventClass;
        on: (type: string, listener: (data?: any) => void) => import("..").EventClass;
        fire: (type: string, data?: any) => import("..").EventClass;
        off: (type: string, listener: (...args: any[]) => void) => import("..").EventClass;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        options: any;
        _isUpdatingOptions?: boolean;
        _initHooksCalled?: boolean;
        _initHooks?: Function[];
        _proxyOptions(): /*elided*/ any;
        _callInitHooks(): /*elided*/ any;
        setOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any;
        configure(conf?: string | import("../core/mixins").ClassOptions, value?: any): import("../core/mixins").ClassOptions | /*elided*/ any;
        onOptionsChange(_conf: import("../core/mixins").ClassOptions): void;
        _visitInitHooks(proto: {
            _initHooks: any;
        }): void;
    };
    mergeOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any & typeof Group;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & typeof Group;
    include(...sources: any[]): /*elided*/ any & typeof Group;
} & typeof Group;
/**
 * Layer abstract base class.
 * 图层抽象基类
 *
 * @description
 * Base class for all layers, providing basic layer functionality:
 * - Visibility control
 * - Opacity setting
 * - Z-index management
 * - Animation support
 *
 * 所有图层的基类，提供图层的基础功能：
 * - 可见性控制
 * - 透明度设置
 * - 层级管理
 * - 动画支持
 *
 * @abstract
 * @extends EventMixin(BaseMixin(Group))
 * @category Layer
 */
export declare abstract class Layer extends Layer_base {
    /**
     * Layer unique identifier.
     * 图层唯一标识
     */
    private _layerId;
    /**
     * Layer opacity.
     * 图层透明度
     */
    opacity: number;
    /**
     * Animation callback set.
     * 动画回调集合
     */
    private _animCallbacks;
    /**
     * Whether it is a scene layer.
     * 是否为场景层
     */
    isSceneLayer: boolean;
    /**
     * Current altitude record.
     * 当前高度记录
     */
    protected _baseAltitude: number;
    /**
     * Layer-level depth offset (default value for style depthOffset).
     * 图层级深度偏移（作为样式 depthOffset 的默认值）
     */
    depthOffset?: number;
    /**
     * Region overlay configuration set (common to all subclasses).
     * 区域蒙版配置集合（所有子类通用）
     */
    private _regionConfigs;
    /**
     * Create a layer instance.
     * 创建图层实例
     * @param layerId - Layer ID. 图层ID
     * @param config - Layer configuration. 图层配置
     * @throws Throws error if id is not provided. 如果未提供id会抛出错误
     */
    constructor(layerId: string, config?: LayerOptions);
    /**
     * Get layer ID.
     * 获取图层ID
     * @returns Layer ID
     *          图层ID
     */
    getId(): string;
    /**
     * Add layer to map.
     * 将图层添加到地图
     * @param mapInstance Map instance
     *            地图实例
     * @returns this
     */
    addTo(mapInstance: Map): this;
    /**
     * Get layer z-index.
     * 获取图层层级
     * @returns Current z-index
     *          当前层级
     */
    getZIndex(): number;
    /**
     * Get layer depth offset.
     * 获取图层深度偏移
     * @returns Current layer depthOffset
     *          当前图层的 depthOffset
     */
    getDepthOffset(): number;
    /**
     * Get layer opacity.
     * 获取图层透明度
     * @returns Current opacity
     *          当前透明度
     */
    getOpacity(): number;
    /**
     * Set layer opacity.
     * 设置图层透明度
     * @param val Opacity value (0-1)
     *                透明度值 (0-1)
     *
     * @description
     * Recursively update opacity of all child elements, including:
     * - Objects with material property
     * - Special types like Sprite
     *
     * 递归更新所有子元素的透明度，包括：
     * - 带有material属性的对象
     * - Sprite等特殊类型
     */
    setOpacity(val: number): void;
    /**
     * Get associated map instance.
     * 获取关联的地图实例
     * @returns Map instance or null
     *          地图实例或null
     */
    getMap(): any;
    /**
     * Show layer.
     * 显示图层
     * @returns this
     */
    show(): this;
    /**
     * Hide layer.
     * 隐藏图层
     * @returns this
     */
    hide(): this;
    /**
     * Set layer altitude.
     * 设置图层高度 (海拔)
     * @param val Altitude value
     *                 高度值
     * @description
     * Modify layer position in vertical direction.
     * 修改图层在垂直方向上的位置。
     */
    setAltitude(val: number): this;
    /**
     * Get current layer altitude.
     * 获取当前图层高度
     * @returns Altitude value
     *          高度值
     */
    getAltitude(): number;
    /**
     * Bind map instance.
     * 绑定地图实例
     * @param mapInstance Map instance
     *            地图实例
     *
     * @protected
     */
    _bindMap(mapInstance: Map): void;
    /**
     * Animation method (Optional implementation for subclasses).
     * 动画方法（子类可选实现）
     * @param delta Frame interval time
     *              帧间隔时间
     * @param elapsedtime Elapsed time
     *                    累计时间
     * @param context SceneRenderer context
     *                SceneRenderer 上下文
     *
     * @protected
     * @abstract
     */
    protected animate?(delta: number, elapsedtime: number, context: SceneRenderer): void;
    /**
     * Register animation callback.
     * 注册动画回调
     *
     * @private
     */
    private _registerAnimate;
    /**
     * Clear animation callbacks.
     * 清除动画回调
     *
     * @protected
     */
    protected _clearAnimationCallbacks(): void;
    /**
     * Get layer configuration.
     * 获取图层配置
     * @returns Layer configuration
     *          图层配置
     */
    getOptions(): LayerOptions;
    /**
     * Batch set region overlays.
     * 批量设置区域蒙版
     * @param configs Region overlay configuration array
     *                 区域蒙版配置数组
     */
    setRegionOverlays(configs: RegionOverlayConfig[]): this;
    /**
     * Add a single region overlay.
     * 添加单个区域蒙版
     * @param overlay Region overlay configuration
     *                区域蒙版配置
     * @returns Generated overlay ID
     *          生成的蒙版 id
     */
    addRegionOverlay(overlay: RegionOverlayConfig): string;
    /**
     * Remove region overlay by ID.
     * 移除指定 id 的区域蒙版
     * @param id Region overlay ID
     *           区域蒙版 id
     */
    removeRegionOverlay(id: string): this;
    /**
     * Clear all region overlays.
     * 清空所有区域蒙版
     */
    clearRegionOverlays(): this;
    /**
     * Get all current region overlays (Returns a copy to avoid direct external modification).
     * 获取当前所有区域蒙版（返回副本，避免外部直接修改）
     */
    getRegionOverlays(): RegionOverlayConfig[];
    /**
     * Generate region overlay ID.
     * 生成区域蒙版 id
     */
    private _generateRegionOverlayId;
}
export {};
