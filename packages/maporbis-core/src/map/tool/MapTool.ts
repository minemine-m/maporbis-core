import type { ClassOptions } from "../../core/mixins";
import { BaseMixin, EventMixin } from "../../core/mixins";
import type { Map as TerraMap } from "../index";

/**
 * MapTool 配置项（预留，将来可以扩展）
 */
export type MapToolOptions = ClassOptions & {};

class EmptyBase {
    constructor(..._args: any[]) {}
}

/**
 * 地图工具基类
 *
 * - 管理工具的生命周期（addTo / enable / disable / remove）
 * - 与 Map 的事件系统对接（内部统一注册/注销事件）
 * - 保证同一张地图同时只存在一个激活工具
 */
export abstract class MapTool extends EventMixin(
    BaseMixin<typeof EmptyBase, any>(EmptyBase)
) {
    /** 绑定的地图实例 */
    protected _map?: TerraMap;
    /** 是否启用中 */
    protected _enabled: boolean = false;
    /** 缓存绑定到 Map 上的事件处理函数，便于 off 时移除 */
    private _boundHandlers = new Map<string, (e: any) => void>();

    /**
     * @param options 工具配置
     */
    constructor(options: MapToolOptions = {}) {
        super(options);
    }

    /**
     * 将工具添加到地图上，并自动启用。
     * 同一张 Map 上会保证只有一个激活的 MapTool。
     */
    addTo(map: TerraMap): this {
        if (!map) return this;

        // 保证工具唯一性：禁用旧工具
        const anyMap = map as any;
        if (anyMap._activeMapTool && anyMap._activeMapTool !== this) {
            anyMap._activeMapTool.disable();
        }
        anyMap._activeMapTool = this;

        this._map = map;

        if (this.onAdd) {
            this.onAdd();
        }

        this.enable();
        this.fire("add", { map });

        return this;
    }

    /**
     * 获取当前绑定的地图实例
     */
    getMap(): TerraMap | undefined {
        return this._map;
    }

    /**
     * 启用工具：绑定事件 + 调用 onEnable 钩子
     */
    enable(): this {
        if (!this._map || this._enabled) return this;

        this._enabled = true;
        this._bindEvents();

        if (this.onEnable) {
            this.onEnable();
        }

        this.fire("enable", { map: this._map });
        return this;
    }

    /**
     * 禁用工具：解绑事件 + 调用 onDisable 钩子
     */
    disable(): this {
        if (!this._map || !this._enabled) return this;

        this._enabled = false;
        this._unbindEvents();

        if (this.onDisable) {
            this.onDisable();
        }

        this.fire("disable", { map: this._map });
        return this;
    }

    /**
     * 工具是否处于启用状态
     */
    isEnabled(): boolean {
        return !!this._enabled;
    }

    /**
     * 从地图上移除工具
     */
    remove(): this {
        if (!this._map) return this;

        this.disable();

        const anyMap = this._map as any;
        if (anyMap._activeMapTool === this) {
            delete anyMap._activeMapTool;
        }

        this._map = undefined;
        this.fire("remove");
        return this;
    }

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
    private _bindEvents() {
        const map = this._map;
        if (!map) return;

        const events = this.getEvents() || {};
        Object.keys(events).forEach((type) => {
            const handler = events[type];
            if (!handler) return;

            // 统一绑定 this，缓存起来，方便 off 时移除
            const bound = (e: any) => handler.call(this, e);
            this._boundHandlers.set(type, bound);
            map.on(type, bound);
        });
    }

    /**
     * 内部：解绑 Map 事件
     */
    private _unbindEvents() {
        const map = this._map;
        if (!map) return;

        this._boundHandlers.forEach((handler, type) => {
            map.off(type, handler);
        });
        this._boundHandlers.clear();
    }
}