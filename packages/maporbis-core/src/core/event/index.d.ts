import { EventDispatcher } from 'three';
/**
 * @category Core
 */
export interface BaseEventMap<Target = any> {
    /** 触发事件的目标对象（泛型） */
    target?: Target;
    /** 原始的DOM事件对象 */
    originEvent: Event;
    /** 事件名称（可选） */
    eventName?: string;
    /** 屏幕坐标信息 */
    screenXY: {
        X: number;
        Y: number;
    };
}
/**
 * 事件管理类
 *
 * 提供事件的订阅、触发和取消订阅功能，基于Three.js的EventDispatcher实现
 * 支持链式调用，并提供与原生Three.js事件系统的集成能力
  * @category Core
 */
export declare class EventClass {
    /** Three.js事件分发器实例 */
    private _dispatcher;
    /**
     * 监听器映射表
     * 结构: { 事件类型: { 原始监听器: 包装函数 } }
     */
    private _listenerMap;
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
    on(type: string, listener: (data?: any) => void): this;
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
    once(type: string, listener: (data?: any) => void): this;
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
    off(type: string, listener: (...args: any[]) => void): this;
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
    fire(type: string, data?: any): this;
    /**
     * 获取原生Three.js事件分发器
     * @returns Three.js的EventDispatcher实例
     *
     * @description
     * 用于与Three.js原生事件系统集成
     */
    get threeEventDispatcher(): EventDispatcher;
}
