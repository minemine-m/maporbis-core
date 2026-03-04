import { Group, Sprite } from "three";
import { BaseMixin, EventMixin } from "../core/mixins";
import { requireParam } from "../utils/validate";
import Handlerable from '../handler/Handlerable';
/**
 * Default layer options.
 * 默认图层配置
 */
const options = {
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
export class Layer extends Handlerable(EventMixin(BaseMixin(Group))) {
    /**
     * Layer unique identifier.
     * 图层唯一标识
     */
    _layerId;
    /**
     * Layer opacity.
     * 图层透明度
     */
    opacity = 1;
    /**
     * Animation callback set.
     * 动画回调集合
     */
    _animCallbacks = new Set();
    /**
     * Whether it is a scene layer.
     * 是否为场景层
     */
    isSceneLayer = false;
    /**
     * Current altitude record.
     * 当前高度记录
     */
    _baseAltitude = 0;
    /**
     * Layer-level depth offset (default value for style depthOffset).
     * 图层级深度偏移（作为样式 depthOffset 的默认值）
     */
    depthOffset;
    /**
     * Region overlay configuration set (common to all subclasses).
     * 区域蒙版配置集合（所有子类通用）
     */
    _regionConfigs = [];
    /**
     * Create a layer instance.
     * 创建图层实例
     * @param layerId - Layer ID. 图层ID
     * @param config - Layer configuration. 图层配置
     * @throws Throws error if id is not provided. 如果未提供id会抛出错误
     */
    constructor(layerId, config) {
        super();
        requireParam(layerId, "id", "Layer ID must be specified 图层ID必须指定");
        if (config) {
            this.setOptions(config);
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
        if (typeof this.animate === 'function') {
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
    getId() {
        return this._layerId;
    }
    /**
     * Add layer to map.
     * 将图层添加到地图
     * @param mapInstance Map instance
     *            地图实例
     * @returns this
     */
    addTo(mapInstance) {
        mapInstance.addLayer(this);
        return this;
    }
    /**
     * Get layer z-index.
     * 获取图层层级
     * @returns Current z-index
     *          当前层级
     */
    getZIndex() {
        const opts = this.options || {};
        return typeof opts.zIndex === 'number' ? opts.zIndex : 0;
    }
    /**
     * Get layer depth offset.
     * 获取图层深度偏移
     * @returns Current layer depthOffset
     *          当前图层的 depthOffset
     */
    getDepthOffset() {
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
    setOpacity(val) {
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
    show() {
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
    hide() {
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
    setAltitude(val) {
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
    getAltitude() {
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
    _bindMap(mapInstance) {
        if (!mapInstance)
            return;
        this.map = mapInstance;
        if (typeof this.animate === 'function') {
            this._registerAnimate();
        }
    }
    /**
     * Register animation callback.
     * 注册动画回调
     *
     * @private
     */
    _registerAnimate() {
        const map = this.getMap();
        if (!map?.sceneRenderer)
            return;
        const removeCallback = map.sceneRenderer.addAnimationCallback((delta, elapsedtime, context) => {
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
    _clearAnimationCallbacks() {
        this._animCallbacks.forEach(remove => remove());
        this._animCallbacks.clear();
    }
    /**
     * Get layer configuration.
     * 获取图层配置
     * @returns Layer configuration
     *          图层配置
     */
    getOptions() {
        return { ...this.options };
    }
    /**
     * Batch set region overlays.
     * 批量设置区域蒙版
     * @param configs Region overlay configuration array
     *                 区域蒙版配置数组
     */
    setRegionOverlays(configs) {
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
    addRegionOverlay(overlay) {
        const id = overlay.id ?? this._generateRegionOverlayId();
        const normalized = {
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
    removeRegionOverlay(id) {
        this._regionConfigs = this._regionConfigs.filter(o => o.id !== id);
        return this;
    }
    /**
     * Clear all region overlays.
     * 清空所有区域蒙版
     */
    clearRegionOverlays() {
        this._regionConfigs = [];
        return this;
    }
    /**
     * Get all current region overlays (Returns a copy to avoid direct external modification).
     * 获取当前所有区域蒙版（返回副本，避免外部直接修改）
     */
    getRegionOverlays() {
        return this._regionConfigs.slice();
    }
    /**
     * Generate region overlay ID.
     * 生成区域蒙版 id
     */
    _generateRegionOverlayId() {
        return `region-overlay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
// Merge default options
// 合并默认配置
Layer.mergeOptions(options);
