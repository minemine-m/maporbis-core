import { Vector3 } from "three";
import { type ClassOptions } from "../core/mixins";
import type { Map as TerraMap } from "../index";
import type { LngLatLike } from "../types";
/**
 * UI Component options.
 * UI 组件配置项
  * @category UI
 */
export type UIComponentOptions = ClassOptions & {
    /**
     * DOM container class, can be string or string[].
     * DOM 容器 class，可为 string 或 string[]
     */
    containerClass?: string | string[];
    /**
     * X pixel offset (positive for right).
     * X 方向像素偏移（右为正）
     */
    dx?: number;
    /**
     * Y pixel offset (positive for down).
     * Y 方向像素偏移（下为正）
     */
    dy?: number;
    /**
     * Whether visible by default.
     * 是否默认可见
     */
    visible?: boolean;
    /**
     * Whether it is a global unique component on the same map (only one of the same kind is displayed).
     * 是否为同一张地图上的全局唯一组件（同类只显示一个）
     */
    single?: boolean;
    /**
     * DOM zIndex.
     * DOM zIndex
     */
    zIndex?: number;
};
declare class EmptyBase {
    constructor(..._args: any[]);
}
declare const UIComponent_base: {
    new (...args: any[]): {
        eventClass: import("../core").EventClass;
        on: (type: string, listener: (data? /**
         * DOM zIndex.
         * DOM zIndex
         */: any) => void) => import("../core").EventClass;
        fire: (type: string, data?: any) => import("../core").EventClass;
        off: (type: string, listener: (...args: any[]) => void) => import("../core").EventClass;
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
        setOptions(options: ClassOptions): /*elided*/ any;
        configure(conf?: string | ClassOptions, value?: any): ClassOptions | /*elided*/ any;
        onOptionsChange(_conf: ClassOptions): void;
        _visitInitHooks(proto: {
            _initHooks: any;
        }): void;
    };
    mergeOptions(options: ClassOptions): /*elided*/ any & typeof EmptyBase;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & typeof EmptyBase;
    include(...sources: any[]): /*elided*/ any & typeof EmptyBase;
} & typeof EmptyBase;
/**
 * UI Component Base Class.
 * UI 组件基类
 * @description
 * Abstraction goals:
 * - Attach to Map or Feature (addTo)
 * - Internally manage DOM lifecycle (buildOn / remove)
 * - Position DOM to screen coordinates based on world coordinates + camera
 * - Update position when listening to map view changes (viewchange)
 *
 * 抽象目标：
 * - 挂到 Map 或 Feature 上（addTo）
 * - 内部管理 DOM 生命周期（buildOn / remove）
 * - 根据世界坐标 + 相机，将 DOM 定位到屏幕坐标
 * - 监听地图视图变化（viewchange）时更新位置
  * @category UI
 */
export declare abstract class UIComponent extends UIComponent_base {
    /**
     * Component options.
     * 组件配置
     */
    options: UIComponentOptions;
    /**
     * Owner object: Map or Feature.
     * 所属对象：Map 或 Feature
     */
    protected _owner?: any;
    /**
     * Map instance.
     * 所属地图实例
     */
    protected _map?: TerraMap;
    /**
     * Current world position.
     * 当前使用的世界坐标
     */
    protected _worldPosition?: Vector3;
    /**
     * Recorded coordinate if passed via show(coordinate).
     * 如果通过 show(coordinate) 传入了坐标，这里记录下来
     */
    private _coordinate?;
    /**
     * Corresponding DOM element.
     * 对应的 DOM 元素
     */
    protected _dom?: HTMLElement;
    /**
     * Whether currently visible.
     * 当前是否可见
     */
    protected _visible: boolean;
    /**
     * Cache event handlers bound to Map for removal on off.
     * 绑定到 Map 的事件处理缓存，便于 off 时移除
     */
    private _boundMapHandlers;
    /**
     * SceneRenderer update event handler.
     * 绑定到 SceneRenderer 的 update 事件处理函数
     */
    private _sceneRendererUpdateHandler?;
    /**
     * Whether position calculation has been done once (to avoid initial wrong position flicker).
     * 是否已经完成过一次位置计算（用于避免第一次错误位置闪一下）
     */
    private _positionedOnce;
    /**
     * Set of "single" components on the same map for mutual exclusion display.
     * 同一张地图上的“single”组件集合，用于互斥显示
     */
    private static _singletons;
    /**
     * @param options UI component options UI 组件配置
     */
    constructor(options?: UIComponentOptions);
    /**
     * Subclasses must implement: Build own DOM.
     * 子类必须实现：构建自身 DOM
     * @returns Created DOM element 创建的 DOM 元素
     */
    protected abstract buildOn(): HTMLElement;
    /**
     * Subclasses optional: For debugging and style distinction.
     * 子类可选：用于调试和样式区分
     * @returns Class name 类名
     */
    protected _getClassName(): string;
    /**
     * Subclasses optional: Extra offset.
     * 子类可选：额外偏移
     * @returns {Object} Offset `{x, y}` 偏移量
     */
    protected getOffset(): {
        x: number;
        y: number;
    };
    /**
     * Lifecycle hook: Called on addTo.
     * 生命周期钩子：addTo 时调用
     */
    protected onAdd?(): void;
    /**
     * Lifecycle hook: Called on remove.
     * 生命周期钩子：remove 时调用
     */
    protected onRemove?(): void;
    /**
     * Lifecycle hook: Called when DOM is removed from container.
     * 生命周期钩子：DOM 从容器移除时调用
     */
    protected onDomRemove?(): void;
    /**
     * Add UIComponent to Map or Feature.
     * 将 UIComponent 添加到 Map 或 Feature 上
     * @param owner Map or Feature Map 或 Feature
     */
    addTo(owner: any): this;
    /**
     * Remove UIComponent from owner Map / Feature.
     * 从所属 Map / Feature 移除 UIComponent
     */
    remove(): this;
    /**
     * Show UIComponent.
     * 显示 UIComponent
     * @param coordinate Geographic coordinate ([lng, lat, alt]), optional 地理坐标（[lng, lat, alt]），可选
     */
    show(coordinate?: LngLatLike): this;
    /**
     * Hide UIComponent (keep DOM, do not unbind).
     * 隐藏 UIComponent（保留 DOM，不解绑）
     */
    hide(): this;
    /**
     * Remove DOM (called on remove).
     * 移除 DOM（remove 时调用）
     */
    hideDom(): this;
    /**
     * Get owner Map.
     * 获取所属 Map
     */
    getMap(): TerraMap | undefined;
    /**
     * Whether currently visible (show state).
     * 当前是否可见（show 状态）
     */
    isVisible(): boolean;
    /**
     * Internal: Bind / Unbind map events.
     * 内部：绑定 / 解绑地图事件
     */
    private _bindMapEvents;
    /**
     * Internal: Derive world position from geographic coordinate / owner.
     * Ensures unified use of map.lngLatToWorld to keep altitude / center units consistent.
     *
     * 内部：根据地理坐标 / owner 推导世界坐标
     * 保证统一走 map.lngLatToWorld，从而保持 altitude / center 单位统一
     */
    private _resolveWorldPosition;
    /**
     * Internal: Update DOM position based on world coordinates.
     * 内部：根据世界坐标更新 DOM 位置
     */
    protected _refreshDomPosition(): void;
}
export {};
