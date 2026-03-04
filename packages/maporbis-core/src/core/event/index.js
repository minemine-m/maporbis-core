import { EventDispatcher } from 'three';
/**
 * 事件管理类
 *
 * 提供事件的订阅、触发和取消订阅功能，基于Three.js的EventDispatcher实现
 * 支持链式调用，并提供与原生Three.js事件系统的集成能力
  * @category Core
 */
export class EventClass {
    /** Three.js事件分发器实例 */
    _dispatcher = new EventDispatcher();
    /**
     * 监听器映射表
     * 结构: { 事件类型: { 原始监听器: 包装函数 } }
     */
    _listenerMap = new Map();
    /**
     * 订阅事件
     * @param type 事件类型
     * @param listener 事件监听函数
     * @returns 当前实例（支持链式调用）
     *
     * @example
     * event.on('click', (data) => {
     *   console.log('click event:', data);
     * });
     */
    on(type, listener) {
        // 创建包装函数
        const wrapper = (e) => listener(e.data || e);
        // 存储原始监听器和包装函数的映射
        if (!this._listenerMap.has(type)) {
            this._listenerMap.set(type, new Map());
        }
        this._listenerMap.get(type).set(listener, wrapper);
        // 添加包装函数到事件分发器
        this._dispatcher.addEventListener(type, wrapper);
        return this;
    }
    /**
     * 一次性订阅事件（触发后自动取消订阅）
     * @param type 事件类型
     * @param listener 事件监听函数
     * @returns 当前实例（支持链式调用）
     *
     * @example
     * event.once('load', () => {
     *   console.log('this will only trigger once');
     * });
     */
    once(type, listener) {
        const wrapper = (e) => {
            this.off(type, wrapper);
            listener(e.data || e);
        };
        return this.on(type, wrapper);
    }
    /**
     * 取消订阅事件
     * @param type 事件类型
     * @param listener 要移除的事件监听函数
     * @returns 当前实例（支持链式调用）
     *
     * @example
     * const handler = (data) => console.log(data);
     * event.on('message', handler);
     * event.off('message', handler);
     */
    off(type, listener) {
        const wrappers = this._listenerMap.get(type);
        if (!wrappers)
            return this;
        const wrapper = wrappers.get(listener);
        if (wrapper) {
            // 移除实际的包装函数
            this._dispatcher.removeEventListener(type, wrapper);
            wrappers.delete(listener);
            // 清理空类型
            if (wrappers.size === 0) {
                this._listenerMap.delete(type);
            }
        }
        return this;
    }
    /**
     * Fire an event.
     * 触发事件
     * @param type Event type. 事件类型
     * @param data Event data to pass (optional). 要传递的事件数据（可选）
     * @returns Current instance (supports chaining). 当前实例（支持链式调用）
     *
     * @example
     * event.fire('update', { time: Date.now() });
     */
    fire(type, data) {
        const event = { type, data };
        this._dispatcher.dispatchEvent(event);
        return this;
    }
    /**
     * 获取原生Three.js事件分发器
     * @returns Three.js的EventDispatcher实例
     *
     * @description
     * 用于与Three.js原生事件系统集成
     */
    get threeEventDispatcher() {
        return this._dispatcher;
    }
}
