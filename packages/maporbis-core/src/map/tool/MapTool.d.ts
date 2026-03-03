import type { ClassOptions } from "../../core/mixins";
import type { Map as TerraMap } from "../index";
/**
 * MapTool 配置项（预留，将来可以扩展）
 */
export type MapToolOptions = ClassOptions & {};
declare class EmptyBase {
    constructor(..._args: any[]);
}
declare const MapTool_base: {
    new (...args: any[]): {
        eventClass: import("../..").EventClass;
        on: (type: string, listener: (data?: any) => void) => import("../..").EventClass;
        fire: (type: string, data?: any) => import("../..").EventClass;
        off: (type: string, listener: (...args: any[]) => void) => import("../..").EventClass;
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
        configure(conf?: string | ClassOptions, value?: any): /*elided*/ any | ClassOptions;
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
 * 地图工具基类
 *
 * - 管理工具的生命周期（addTo / enable / disable / remove）
 * - 与 Map 的事件系统对接（内部统一注册/注销事件）
 * - 保证同一张地图同时只存在一个激活工具
 */
export declare abstract class MapTool extends MapTool_base {
    /** 绑定的地图实例 */
    protected _map?: TerraMap;
    /** 是否启用中 */
    protected _enabled: boolean;
    /** 缓存绑定到 Map 上的事件处理函数，便于 off 时移除 */
    private _boundHandlers;
    /**
     * @param options 工具配置
     */
    constructor(options?: MapToolOptions);
    /**
     * 将工具添加到地图上，并自动启用。
     * 同一张 Map 上会保证只有一个激活的 MapTool。
     */
    addTo(map: TerraMap): this;
    /**
     * 获取当前绑定的地图实例
     */
    getMap(): TerraMap | undefined;
    /**
     * 启用工具：绑定事件 + 调用 onEnable 钩子
     */
    enable(): this;
    /**
     * 禁用工具：解绑事件 + 调用 onDisable 钩子
     */
    disable(): this;
    /**
     * 工具是否处于启用状态
     */
    isEnabled(): boolean;
    /**
     * 从地图上移除工具
     */
    remove(): this;
    /**
     * 子类实现：返回需要绑定到 Map 上的事件映射
     *
     * key: 事件名（如 'click', 'mousemove'）
     * value: 事件处理函数（参数为 Map 的事件数据）
     *
     * 注意：
     * - 不要求提前 bind(this)，MapTool 内部会统一绑定 this
     */
    protected abstract getEvents(): Record<string, (e: any) => void>;
    /**
     * 生命周期钩子：工具刚 addTo(map) 时调用
     */
    protected onAdd?(): void;
    /**
     * 生命周期钩子：工具 enable() 时调用
     */
    protected onEnable?(): void;
    /**
     * 生命周期钩子：工具 disable() 时调用
     */
    protected onDisable?(): void;
    /**
     * 内部：绑定 Map 事件
     */
    private _bindEvents;
    /**
     * 内部：解绑 Map 事件
     */
    private _unbindEvents;
}
export {};
