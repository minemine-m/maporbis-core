import { MixinConstructor } from "../core/mixins";
import Handler from "./Handler";

/**
 * A mixin, to enable a class with [interaction handlers]{@link Handler}
 * @protected
 * @category handler
 * @mixin Handlerable
 */
export default function <T extends MixinConstructor>(Base: T) {

    return class Handlerable extends Base {
        //@internal
        [key: string]: any; // 添加索引签名
        _handlers?: Handler[];
        constructor(...args: any[]) {  // 构造函数
            super(...args);  // 允许参数向上传递
            this._handlers = [];
        }

        /**
         * Register a handler
         * 注册处理器
         * @param {String} name       - name of the handler 处理器名称
         * @param {Handler}           - handler class 处理器类
         * @return {*} this
         * @protected
         * @function Handerable.addHandler
         */
        addHandler(name: string | number, handlerClass: new (arg0: this) => any) {
            // console.log('我是没戏')
            if (!handlerClass) {
                return this;
            }
            if (!this._handlers) {
                this._handlers = [];
            }
            //handler已经存在
            if (this[name]) {
                this[name].enable();
                return this;
            }

            const handler = this[name] = new handlerClass(this);

            this._handlers.push(handler);
            // console.log((this as any).options[name], '(this as any).options[name]')
            // console.log(this.options, 'this.options')
            if ((this as any).options[name]) {
                handler.enable();
            }
            return this;
        }

        /**
         * Removes a handler
         * @param {String} name       - name of the handler
         * @return {*} this
         * @protected
         * @function Handerable.removeHandler
         */
        removeHandler(name: string | number) {
            if (!name) {
                return this;
            }
            const handler = this[name];
            if (handler) {
                if (this._handlers) {
                    //handler registered
                    const hit = this._handlers.indexOf(handler);
                    if (hit >= 0) {
                        this._handlers.splice(hit, 1);
                    }
                    this[name].remove();
                    delete this[name];
                }

            }
            return this;
        }

        //@internal
        _clearHandlers() {
            if (this._handlers) {
                for (let i = 0, len = this._handlers.length; i < len; i++) {
                    this._handlers[i].remove();
                }
                this._handlers = [];
            }

        }
    };
}
