import Handler from '../../handler/Handler';
import { Feature } from '../../feature/Feature';
import { BaseEventMap } from '../../core/event';
import { LngLatLike } from '../../types';
/**
 * @category Map
 */
export interface FeatureEventMap extends BaseEventMap<Feature> {
    coordinate?: LngLatLike;
}
/**
 * Map Feature Events Handler.
 * 地图要素事件处理器
 * @description
 * Handles interaction events for Features on the map.
 * 处理地图上要素的交互事件。
 */
declare class MapFeatureEventsHandler extends Handler {
    /**
     * Store registered event types for easy removal
     * 存储已注册的事件类型，方便移除时使用
     */
    private _registeredEvents;
    /**
     * Mouse down timestamp for click detection
     * 鼠标按下的时间戳，用于点击检测
     */
    private _mouseDownTime;
    /**
     * Add event hooks.
     * 添加事件钩子。
     */
    addHooks(): void;
    /**
     * Remove event hooks.
     * 移除事件钩子。
     */
    removeHooks(): void;
    /**
     * Common event handling
     * 事件公共处理
     * @param e Event object 事件对象
     */
    private _eventCommon;
    /**
     * Unified event handling
     * 统一事件处理
     *
     * @param domEvent Original DOM event
     *                 原始 DOM 事件
     * @param eventType Event type
     *                  事件类型
     */
    private _handleEvent;
    /**
     * Handle click event
     * 处理点击事件
     *
     * @param feature Clicked Feature
     *                点击的Feature
     * @param domEvent Original DOM event
     *                 原始DOM事件
     */
    private _handleClickEvent;
    /**
     * Handle move event (includes mouseenter/leave)
     * 处理移动事件（包含mouseenter/leave）
     *
     * @param feature Feature under mouse
     *                鼠标下的Feature
     * @param domEvent Original DOM event
     *                 原始DOM事件
     */
    handleMoveEvent(feature: Feature | null, domEvent: MouseEvent | TouchEvent): void;
    /**
     * Fire Feature event
     * 触发Feature事件
     * @param feature Feature triggering the event 触发事件的Feature
     * @param eventType Event type 事件类型
     * @param domEvent Original DOM event 原始DOM事件
     */
    private _fireFeatureEvent;
    /**
     * Check if event should be ignored
     * 检查是否应该忽略该事件
     * @param eventType Event type for special judgment 事件类型，用于特殊判断
     */
    private _shouldIgnoreEvent;
}
export default MapFeatureEventsHandler;
