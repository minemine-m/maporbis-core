import { MixinConstructor } from "../core/mixins";
import Handler from "./Handler";
/**
 * A mixin, to enable a class with [interaction handlers]{@link Handler}
 * @protected
 * @category handler
 * @mixin Handlerable
 */
export default function <T extends MixinConstructor>(Base: T): {
    new (...args: any[]): {
        [key: string]: any;
        _handlers?: Handler[];
        /**
         * Register a handler
         * 注册处理器
         * @param {String} name       - name of the handler 处理器名称
         * @param {Handler}           - handler class 处理器类
         * @return {*} this
         * @protected
         * @function Handerable.addHandler
         */
        addHandler(name: string | number, handlerClass: new (arg0: /*elided*/ any) => any): /*elided*/ any;
        /**
         * Removes a handler
         * @param {String} name       - name of the handler
         * @return {*} this
         * @protected
         * @function Handerable.removeHandler
         */
        removeHandler(name: string | number): /*elided*/ any;
        _clearHandlers(): void;
    };
} & T;
