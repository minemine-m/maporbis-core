
import { BaseMixin, EventMixin } from "../core/mixins";

class Base { }

/**
 * 所有交互Handler类的基类
 *
 * @english
 * Base class for all the interaction handlers
 * @category Interaction
 * @abstract
 * @protected
 */
abstract class Handler extends EventMixin(
    BaseMixin<typeof Base, any>(Base)
) {
    target: any;
    dom?: HTMLElement;
    //@internal
    _enabled: boolean = false;

    constructor(target: any) {
        super();
        this.target = target;
    }

    /**
     * Add event hooks
     * 添加事件钩子
     */
    abstract addHooks(): void

    /**
     * Remove event hooks
     * 移除事件钩子
     */
    abstract removeHooks(): void

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
