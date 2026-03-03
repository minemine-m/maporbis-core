declare class Base {
}
declare const Handler_base: {
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
    mergeOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any & typeof Base;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & typeof Base;
    include(...sources: any[]): /*elided*/ any & typeof Base;
} & typeof Base;
/**
 * 所有交互Handler类的基类
 *
 * @english
 * Base class for all the interaction handlers
 * @category Interaction
 * @abstract
 * @protected
 */
declare abstract class Handler extends Handler_base {
    target: any;
    dom?: HTMLElement;
    _enabled: boolean;
    constructor(target: any);
    /**
     * Add event hooks
     * 添加事件钩子
     */
    abstract addHooks(): void;
    /**
     * Remove event hooks
     * 移除事件钩子
     */
    abstract removeHooks(): void;
    /**
     * 启用Handler
     *
     * @english
     * Enables the handler
     */
    enable(): this;
    /**
     * 停用Handler
     *
     * @english
     * Disables the handler
     */
    disable(): this;
    /**
     * 检查Handler是否启用
     *
     * @english
     * Returns true if the handler is enabled.
     */
    enabled(): boolean;
    /**
     * 从target上移除Handler
     *
     * @english
     * remove handler from target
     */
    remove(): void;
}
export default Handler;
