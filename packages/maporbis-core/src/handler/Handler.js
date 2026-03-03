import { BaseMixin, EventMixin } from "../core/mixins";
class Base {
}
/**
 * 所有交互Handler类的基类
 *
 * @english
 * Base class for all the interaction handlers
 * @category Interaction
 * @abstract
 * @protected
 */
class Handler extends EventMixin(BaseMixin(Base)) {
    constructor(target) {
        super();
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        //@internal
        Object.defineProperty(this, "_enabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.target = target;
    }
    /**
     * 启用Handler
     *
     * @english
     * Enables the handler
     */
    enable() {
        if (this._enabled) {
            return this;
        }
        this._enabled = true;
        this.addHooks();
        return this;
    }
    /**
     * 停用Handler
     *
     * @english
     * Disables the handler
     */
    disable() {
        if (!this._enabled) {
            return this;
        }
        this._enabled = false;
        this.removeHooks();
        return this;
    }
    /**
     * 检查Handler是否启用
     *
     * @english
     * Returns true if the handler is enabled.
     */
    enabled() {
        return !!this._enabled;
    }
    /**
     * 从target上移除Handler
     *
     * @english
     * remove handler from target
     */
    remove() {
        this.disable();
        delete this.target;
        delete this.dom;
    }
}
export default Handler;
