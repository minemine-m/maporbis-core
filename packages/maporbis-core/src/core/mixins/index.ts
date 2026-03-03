import { EventClass } from '../event';
import { assign, isNullOrUndefined } from '../../utils';
import Handler from '../../handler/Handler';
import Browser from '../Browser';

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
export function EventMixin<T extends { new(...args: any[]): {} }>(Base: T) {
    return class extends Base {
        constructor(...args: any[]) {  // 确保存在
            super(...args);
            this.eventClass = new EventClass();
        }
        /** Event class instance. 事件类实例 */
        eventClass = new EventClass();

        /** Subscribe to event. 订阅事件 */
        on = this.eventClass.on.bind(this.eventClass);
        /** Fire an event. 触发事件 */
        fire = this.eventClass.fire.bind(this.eventClass);
        /** Unsubscribe from event. 取消订阅 */
        off = this.eventClass.off.bind(this.eventClass);
    };
}


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
export function BaseMixin<T extends new (...args: any[]) => any, _S = any>(
    Base: T
) {
    return class extends Base {
        /** 类的配置选项 */
        options: any;
        //@internal
        _isUpdatingOptions?: boolean;
        //@internal
        _initHooksCalled?: boolean;
        //@internal
        _initHooks?: Function[];

        constructor(...args: any[]) {
            super(...args);  // 允许参数向上传递
            // this.options = (args[0] || {}) as S;

            // Merge prototype defaults and passed arguments
            // 合并原型默认值和传入参数
            const protoOptions = Object.getPrototypeOf(this).options || {};
            const _args = assign({}, protoOptions, args[0] || {});
            // this.options = assign({}, protoOptions, args[0] || {});
            this.setOptions(_args);
            this._callInitHooks();
            this._isUpdatingOptions = false;
        }

        _proxyOptions() {
            if (!Browser.proxy) {
                return this;
            }
            this.options = new Proxy(this.options as any, {
                set: (target, key, value) => {
                    key = key as string;
                    if (target[key] === value) {
                        return true;
                    }
                    target[key] = value;
                    if (this._isUpdatingOptions) {
                        return true;
                    }
                    const opts = {};
                    (opts as ClassOptions)[key] = value;
                    this.configure(opts);
                    return true;
                }
            });
            return this;
        }

        _callInitHooks() {
            const proto = Object.getPrototypeOf(this);
            this._visitInitHooks(proto);
            return this;
        }

        setOptions(options: ClassOptions) {
            if (!this.hasOwnProperty('options') || isNullOrUndefined(this.options)) {
                this.options = this.options ? Object.create(this.options) : {};
            }
            if (!options) {
                return this;
            }
            for (const i in options) {
                this.options[i] = options[i];
            }
            return this;
        }

        configure(conf?: string | ClassOptions, value?: any): ClassOptions | this {
            this._isUpdatingOptions = true;
            if (!conf) {
                const config = {} as ClassOptions;
                for (const p in this.options) {
                    if (this.options.hasOwnProperty(p)) {
                        config[p] = this.options[p];
                    }
                }
                this._isUpdatingOptions = false;
                return config;
            } else {
                if (arguments.length === 2 && typeof conf === 'string') {
                    const t = {};
                    (t as ClassOptions)[conf] = value;
                    conf = t;
                }
                conf = conf as ClassOptions;
                for (const i in conf) {
                    this.options[i] = conf[i];
                    if (this[i] && (this[i] instanceof Handler)) {
                        if (conf[i]) {
                            this[i].enable();
                        } else {
                            this[i].disable();
                        }
                    }
                }
                this.onOptionsChange(conf);
                this._isUpdatingOptions = false;
            }
            return this;
        }

        onOptionsChange(_conf: ClassOptions) {
            // Can be overridden by subclasses
            // 可以被子类覆盖
        }

        _visitInitHooks(proto: { _initHooks: any; }) {
            if (this._initHooksCalled) {
                return;
            }
            const parentProto = Object.getPrototypeOf(proto);
            if (parentProto._visitInitHooks) {
                parentProto._visitInitHooks.call(this, parentProto);
            }
            this._initHooksCalled = true;
            const hooks = proto._initHooks;
            if (hooks && hooks !== parentProto._initHooks) {
                for (let i = 0; i < hooks.length; i++) {
                    hooks[i].call(this);
                }
            }
        }

        /**
         * 合并类选项（静态方法）
         * @param options 要合并的选项
         * @returns 类本身（支持链式调用）
         */
        static mergeOptions(options: ClassOptions) {
            const proto = this.prototype;
            const parentProto = Object.getPrototypeOf(proto);

            if (!proto.hasOwnProperty('options')) {
                proto.options = {};
            } else if (proto.options === parentProto.options) {
                proto.options = Object.create(proto.options);
            }

            assign(proto.options, options);
            return this;
        }

        static addInitHook(fn: Function | string, ...args: any[]) {
            const init: Function = typeof fn === 'function' ? fn : function (this: any) {
                this[fn].apply(this, args);  // 不再报错
            };
            const proto = this.prototype;
            const parentProto = Object.getPrototypeOf(proto);
            if (!proto._initHooks || proto._initHooks === parentProto._initHooks) {
                proto._initHooks = [];
            }
            proto._initHooks.push(init);
            return this;
        }

        static include(...sources: any[]) {
            for (let i = 0; i < sources.length; i++) {
                assign(this.prototype, sources[i]);
            }
            return this;
        }
    };
}


/* eslint-disable @typescript-eslint/ban-types  * @category Core
/* eslint-disable @typescript-eslint/ban-types */
export type MixinConstructor = new (...args: any[]) => {};
/* eslint-enable @typescript-eslint/ban-types */