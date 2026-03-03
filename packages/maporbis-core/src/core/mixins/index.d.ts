import { EventClass } from '../event';
/** 类选项类型  * @category Core
/** 类选项类型 */
export type ClassOptions = Record<string, any>;
/**
 * 事件混入函数
 * @template T 基类类型
 * @param Base 要混入的基类
 * @returns 混入事件功能后的新类
 *
 * @description
 * 该混入为类添加事件发布订阅能力，包括：
 * - on() 方法：订阅事件
 * - trigger() 方法：触发事件
 * - off() 方法：取消订阅
 *
 * @example
 * class MyClass extends EventMixin(BaseClass) {
 *   // 现在MyClass实例拥有事件功能
 * }
  * @category Core
 */
export declare function EventMixin<T extends {
    new (...args: any[]): {};
}>(Base: T): {
    new (...args: any[]): {
        /** Event class instance. 事件类实例 */
        eventClass: EventClass;
        /** Subscribe to event. 订阅事件 */
        on: (type: string, listener: (data?: any) => void) => EventClass;
        /** Fire an event. 触发事件 */
        fire: (type: string, data?: any) => EventClass;
        /** Unsubscribe from event. 取消订阅 */
        off: (type: string, listener: (...args: any[]) => void) => EventClass;
    };
} & T;
/**
 * 基础混入函数（提供状态管理能力）
 * @template T 基类类型
 * @template S 状态类型（默认为any）
 * @param Base 要混入的基类
 * @returns 混入基础功能后的新类
 *
 * @description
 * 该混入为类添加：
 * - options 属性：用于存储配置选项
 * - mergeOptions 静态方法：合并类默认选项
 * - 完整的 Class 功能（包括 init hooks、配置管理等）
 *
 * @example
 * class MyClass extends BaseMixin(BaseClass) {
 *   // 现在MyClass拥有完整的Class功能
 * }
  * @category Core
 */
export declare function BaseMixin<T extends new (...args: any[]) => any, _S = any>(Base: T): {
    new (...args: any[]): {
        [x: string]: any;
        /** 类的配置选项 */
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
    /**
     * 合并类选项（静态方法）
     * @param options 要合并的选项
     * @returns 类本身（支持链式调用）
     */
    mergeOptions(options: ClassOptions): /*elided*/ any & T;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & T;
    include(...sources: any[]): /*elided*/ any & T;
} & T;
export type MixinConstructor = new (...args: any[]) => {};
