import { BaseMixin, EventMixin } from "../../core/mixins";
class EmptyBase {
    constructor(..._args) { }
}
/**
 * 地图工具基类
 *
 * - 管理工具的生命周期（addTo / enable / disable / remove）
 * - 与 Map 的事件系统对接（内部统一注册/注销事件）
 * - 保证同一张地图同时只存在一个激活工具
 */
export class MapTool extends EventMixin(BaseMixin(EmptyBase)) {
    /** 绑定的地图实例 */
    _map;
    /** 是否启用中 */
    _enabled = false;
    /** 缓存绑定到 Map 上的事件处理函数，便于 off 时移除 */
    _boundHandlers = new Map();
    /**
     * @param options 工具配置
     */
    constructor(options = {}) {
        super(options);
    }
    /**
     * 将工具添加到地图上，并自动启用。
     * 同一张 Map 上会保证只有一个激活的 MapTool。
     */
    addTo(map) {
        if (!map)
            return this;
        // 保证工具唯一性：禁用旧工具
        const anyMap = map;
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
    getMap() {
        return this._map;
    }
    /**
     * 启用工具：绑定事件 + 调用 onEnable 钩子
     */
    enable() {
        if (!this._map || this._enabled)
            return this;
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
    disable() {
        if (!this._map || !this._enabled)
            return this;
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
    isEnabled() {
        return !!this._enabled;
    }
    /**
     * 从地图上移除工具
     */
    remove() {
        if (!this._map)
            return this;
        this.disable();
        const anyMap = this._map;
        if (anyMap._activeMapTool === this) {
            delete anyMap._activeMapTool;
        }
        this._map = undefined;
        this.fire("remove");
        return this;
    }
    /**
     * 内部：绑定 Map 事件
     */
    _bindEvents() {
        const map = this._map;
        if (!map)
            return;
        const events = this.getEvents() || {};
        Object.keys(events).forEach((type) => {
            const handler = events[type];
            if (!handler)
                return;
            // 统一绑定 this，缓存起来，方便 off 时移除
            const bound = (e) => handler.call(this, e);
            this._boundHandlers.set(type, bound);
            map.on(type, bound);
        });
    }
    /**
     * 内部：解绑 Map 事件
     */
    _unbindEvents() {
        const map = this._map;
        if (!map)
            return;
        this._boundHandlers.forEach((handler, type) => {
            map.off(type, handler);
        });
        this._boundHandlers.clear();
    }
}
