import { Group, Sprite } from "three";
import { BaseMixin, EventMixin } from "../core/mixins";
import type { Map } from '../map';
import type { SceneRenderer } from '../renderer';
import { requireParam } from "../utils/validate";
import Handlerable from '../handler/Handlerable';

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
    attribution?: string,
    /**
     * Whether the layer is visible.
     * 是否可见
     */
    visible?: boolean,
    /**
     * Opacity (0-1).
     * 透明度 (0-1)
     */
    opacity?: number,
    /**
     * Layer z-index.
     * 图层层级
     */
    zIndex?: number,
    /**
     * Whether it is a scene layer.
     * 是否为场景层
     */
    isSceneLayer?: boolean,
    /**
     * Base altitude of the layer.
     * 图层基础高度/海拔
     */
    altitude?: number,
    /**
     * Layer-level depth offset (default value for style depthOffset).
     * 图层级深度偏移（作为样式 depthOffset 的默认值）
     */
    depthOffset?: number
}

/**
 * Default layer options.
 * 默认图层配置
 */
const options: LayerOptions = {
    'attribution': '',
    'visible': true,
    'opacity': 1,
    'zIndex': 0,
    'isSceneLayer': false,
    'altitude': 0 // Default altitude is 0 默认高度为0
};

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
export abstract class Layer extends Handlerable(EventMixin(
    BaseMixin<typeof Group, any>(Group)
)) {
    /**
     * Layer unique identifier.
     * 图层唯一标识
     */
    private _layerId: string;
    /**
     * Layer opacity.
     * 图层透明度
     */
    public opacity: number = 1;
    /**
     * Animation callback set.
     * 动画回调集合
     */
    private _animCallbacks = new Set<() => void>();
    /**
     * Whether it is a scene layer.
     * 是否为场景层
     */
    public isSceneLayer: boolean = false;
    /**
     * Current altitude record.
     * 当前高度记录
     */
    protected _baseAltitude: number = 0;
    /**
     * Layer-level depth offset (default value for style depthOffset).
     * 图层级深度偏移（作为样式 depthOffset 的默认值）
     */
    depthOffset?: number
    /**
     * Region overlay configuration set (common to all subclasses).
     * 区域蒙版配置集合（所有子类通用）
     */
    private _regionConfigs: RegionOverlayConfig[] = [];

    /**
     * Create a layer instance.
     * 创建图层实例
     * @param layerId - Layer ID. 图层ID
     * @param config - Layer configuration. 图层配置
     * @throws Throws error if id is not provided. 如果未提供id会抛出错误
     */
    constructor(layerId: string, config?: LayerOptions) {
        super();
        requireParam(layerId, "id", "Layer ID must be specified 图层ID必须指定");
        if (config) {
            this.setOptions(config as any);
            this.opacity = config.opacity || 1;
            this.isSceneLayer = config.isSceneLayer ?? false;
            // console.log(this._type, 'this._type');
            // Initialize altitude
            // 初始化高度
            if (config.altitude !== undefined) {
                this.setAltitude(config.altitude);
            }
        }
        this._layerId = layerId;

        // Automatically register subclass animate method
        // 自动注册子类的animate方法
        if (typeof (this as any).animate === 'function') {
            this._registerAnimate();
        }
        // alert(this._layerId)
    }

    /**
     * Get layer ID.
     * 获取图层ID
     * @returns Layer ID
     *          图层ID
     */
    getId(): string {
        return this._layerId;
    }

    /**
     * Add layer to map.
     * 将图层添加到地图
     * @param mapInstance Map instance
     *            地图实例
     * @returns this
     */
    addTo(mapInstance: Map) {
        mapInstance.addLayer(this);
        return this;
    }

    /**
     * Get layer z-index.
     * 获取图层层级
     * @returns Current z-index
     *          当前层级
     */
    getZIndex(): number {
        const opts = this.options || {};
        return typeof opts.zIndex === 'number' ? opts.zIndex : 0;
    }
    /**
     * Get layer depth offset.
     * 获取图层深度偏移
     * @returns Current layer depthOffset
     *          当前图层的 depthOffset
     */
    getDepthOffset(): number {
        const opts = this.options || {};
        return typeof opts.depthOffset === 'number' ? opts.depthOffset : 0;
    }

    /**
     * Get layer opacity.
     * 获取图层透明度
     * @returns Current opacity
     *          当前透明度
     */
    getOpacity() {
        return this.opacity;
    }

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
    setOpacity(val: number) {
        this.opacity = val;

        this.traverse((child) => {
            // Handle material objects
            // 处理材质对象
            if ('material' in child) {
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach(mat => {
                    if ('opacity' in mat) {
                        mat.transparent = val < 1;
                        mat.opacity = val;
                        mat.needsUpdate = true;
                    }
                });
            }

            // Handle Sprite
            // 处理Sprite
            if (child instanceof Sprite) {
                child.material.opacity = val;
                child.material.transparent = val < 1;
                child.material.needsUpdate = true;
            }
        });
    }

    /**
     * Get associated map instance.
     * 获取关联的地图实例
     * @returns Map instance or null
     *          地图实例或null
     */
    getMap() {
        if (this.map) {
            return this.map;
        }
        return null;
    }

    /**
     * Show layer.
     * 显示图层
     * @returns this
     */
    show(): this {
        if (!this.visible) {
            this.visible = true;
            this.options.visible = true;
            const map = this.getMap();
            if (map) {
                // map.layerVisibilityChanged(this, true);
            }
        }
        return this;
    }

    /**
     * Hide layer.
     * 隐藏图层
     * @returns this
     */
    hide(): this {
        if (this.visible) {
            this.visible = false;
            this.options.visible = false;
            const map = this.getMap();
            if (map) {
                // map.layerVisibilityChanged(this, false);
            }
        }
        return this;
    }

    /**
     * Set layer altitude.
     * 设置图层高度 (海拔)
     * @param val Altitude value
     *                 高度值
     * @description 
     * Modify layer position in vertical direction.
     * 修改图层在垂直方向上的位置。
     */
    setAltitude(val: number) {

        this.position.y = val;
        this.updateMatrix(); // Ensure matrix update 确保矩阵更新
        this.updateMatrixWorld(true);

        return this;
    }
    /**
     * Get current layer altitude.
     * 获取当前图层高度
     * @returns Altitude value
     *          高度值
     */
    getAltitude(): number {
        // Read directly from position to ensure it is always the real value
        // 直接从 position 读取，确保永远是真实值
        return this.position.y;
    }


    /**
     * Bind map instance.
     * 绑定地图实例
     * @param mapInstance Map instance
     *            地图实例
     *
     * @protected
     */
    _bindMap(mapInstance: Map) {
        if (!mapInstance) return;

        this.map = mapInstance;
        if (typeof (this as any).animate === 'function') {
            this._registerAnimate();
        }
    }

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
    private _registerAnimate() {
        const map = this.getMap();
        if (!map?.sceneRenderer) return;

        const removeCallback = map.sceneRenderer.addAnimationCallback((delta: number, elapsedtime: number, context: SceneRenderer) => {
            this.animate?.(delta, elapsedtime, context);
        });

        this._animCallbacks.add(removeCallback);
    }

    /**
     * Clear animation callbacks.
     * 清除动画回调
     * 
     * @protected
     */
    protected _clearAnimationCallbacks() {
        this._animCallbacks.forEach(remove => remove());
        this._animCallbacks.clear();
    }
    /**
     * Get layer configuration.
     * 获取图层配置
     * @returns Layer configuration
     *          图层配置
     */
    getOptions(): LayerOptions {
        return { ...this.options };
    }
    /**
     * Batch set region overlays.
     * 批量设置区域蒙版
     * @param configs Region overlay configuration array
     *                 区域蒙版配置数组
     */
    setRegionOverlays(configs: RegionOverlayConfig[]): this {
        this._regionConfigs = (configs || []).map(o => ({
            id: o.id ?? this._generateRegionOverlayId(),
            color: o.color ?? '#00FF88',
            opacity: o.opacity ?? 0.3,
            mode: o.mode ?? 'overlay',
            zIndex: o.zIndex ?? 0,
            geometry: o.geometry,
            feature: o.feature
        }));
        return this;
    }

    /**
     * Add a single region overlay.
     * 添加单个区域蒙版
     * @param overlay Region overlay configuration
     *                区域蒙版配置
     * @returns Generated overlay ID
     *          生成的蒙版 id
     */
    addRegionOverlay(overlay: RegionOverlayConfig): string {
        const id = overlay.id ?? this._generateRegionOverlayId();
        const normalized: RegionOverlayConfig = {
            id,
            color: overlay.color ?? '#00FF88',
            opacity: overlay.opacity ?? 0.3,
            mode: overlay.mode ?? 'overlay',
            zIndex: overlay.zIndex ?? 0,
            geometry: overlay.geometry,
            feature: overlay.feature
        };
        this._regionConfigs.push(normalized);
        return id;
    }

    /**
     * Remove region overlay by ID.
     * 移除指定 id 的区域蒙版
     * @param id Region overlay ID
     *           区域蒙版 id
     */
    removeRegionOverlay(id: string): this {
        this._regionConfigs = this._regionConfigs.filter(o => o.id !== id);
        return this;
    }

    /**
     * Clear all region overlays.
     * 清空所有区域蒙版
     */
    clearRegionOverlays(): this {
        this._regionConfigs = [];
        return this;
    }

    /**
     * Get all current region overlays (Returns a copy to avoid direct external modification).
     * 获取当前所有区域蒙版（返回副本，避免外部直接修改）
     */
    getRegionOverlays(): RegionOverlayConfig[] {
        return this._regionConfigs.slice();
    }

    /**
     * Generate region overlay ID.
     * 生成区域蒙版 id
     */
    private _generateRegionOverlayId(): string {
        return `region-overlay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

}

// Merge default options
// 合并默认配置
Layer.mergeOptions(options)
