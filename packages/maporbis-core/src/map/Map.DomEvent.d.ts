import { Map } from "./index";
import { LngLatLike } from '../types';
import { BaseEventMap } from '../core/event';
/**
 * @category Map
 */
export interface DomEventMap extends BaseEventMap<Map> {
    /**
     * Geographic coordinate of the event (optional)
     * 事件的地理坐标（可选）
     */
    coordinate?: LngLatLike;
}
/**
 * Extend Map class type definition
 * 扩展Map类的类型定义
 */
declare module "./index" {
    interface Map {
        /**
         * @internal
         * Remove all DOM event listeners
         * 移除所有DOM事件监听
         */
        _removeDomEvents(): void;
        /**
         * @internal
         * Register DOM event listeners
         * 注册DOM事件监听
         */
        _registerDomEvents(): void;
    }
}
