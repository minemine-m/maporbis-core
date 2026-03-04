import Handler from '../../handler/Handler';
import { Map } from '../index';
import { getLocalFromMouse } from '../../utils/tilemaputils';
const eventMaps = [
    'click', // Click 点击
    'dblclick', // Double click 双击
    'mousedown', // Mouse down 鼠标按下
    'mouseup', // Mouse up 鼠标释放
    'mousemove', // Mouse move 鼠标移动
    'mouseenter', // Mouse enter element (no bubbling) 鼠标进入元素（不冒泡）
    'mouseleave', // Mouse leave element (no bubbling) 鼠标离开元素（不冒泡）
    'mouseover', // Mouse enter element (bubbling) 鼠标进入元素（冒泡）
    'mouseout', // Mouse leave element (bubbling) 鼠标离开元素（冒泡）
    'contextmenu',
    'touchstart',
    'touchmove',
    'touchend',
];
/**
 * Map Feature Events Handler.
 * 地图要素事件处理器
 * @description
 * Handles interaction events for Features on the map.
 * 处理地图上要素的交互事件。
 */
class MapFeatureEventsHandler extends Handler {
    /**
     * Store registered event types for easy removal
     * 存储已注册的事件类型，方便移除时使用
     */
    _registeredEvents = [];
    /**
     * Mouse down timestamp for click detection
     * 鼠标按下的时间戳，用于点击检测
     */
    _mouseDownTime = 0;
    /**
     * Add event hooks.
     * 添加事件钩子。
     */
    addHooks() {
        const map = this.target;
        const dom = map.getContainer();
        if (dom) {
            eventMaps.forEach((eventType) => {
                // Fix [Violation] Added non-passive event listener to a scroll-blocking event
                // 对于 touchstart, touchmove, wheel，如果不需要阻止默认行为，应设为 passive: true
                // FeatureEvents 主要用于拾取和分发，通常不负责视图控制（由 MapControls 负责），
                // 因此这里设为 passive: true 是安全的，且能提升滚动性能。
                let options = false;
                if (['touchstart', 'touchmove', 'wheel'].includes(eventType)) {
                    options = { passive: true };
                }
                dom.addEventListener(eventType, this._eventCommon, options);
                this._registeredEvents.push(eventType); // Record registered event 记录已注册事件
            });
        }
    }
    /**
     * Remove event hooks.
     * 移除事件钩子。
     */
    removeHooks() {
        const map = this.target;
        const dom = map.getContainer();
        if (dom && this._registeredEvents.length > 0) {
            this._registeredEvents.forEach((eventType) => {
                const typedEventType = eventType;
                dom.removeEventListener(typedEventType, this._eventCommon);
            });
            this._registeredEvents = []; // Clear records 清空记录
        }
    }
    /**
     * Common event handling
     * 事件公共处理
     * @param e Event object 事件对象
     */
    _eventCommon = (e) => {
        // console.log(e.type, 'Got event 拿到了事件');
        // Record down time to filter long press click
        // 记录按下时间，用于过滤长按 click
        if (e.type === 'mousedown' || e.type === 'touchstart') {
            this._mouseDownTime = Date.now();
        }
        if (e.type === 'click') {
            // Ignore long press (over 300ms) click
            // 忽略长按（超过300ms）的点击
            if (Date.now() - this._mouseDownTime > 300)
                return;
        }
        this._handleEvent(e, e.type);
    };
    /**
     * Unified event handling
     * 统一事件处理
     *
     * @param domEvent Original DOM event
     *                 原始 DOM 事件
     * @param eventType Event type
     *                  事件类型
     */
    _handleEvent(domEvent, eventType) {
        // console.log('FeatureEvents _handleEvent ---- Start 起初', eventType);
        const map = this.target;
        // if (eventType !== 'mousedown') return
        //   debugger
        // console.log('FeatureEvents _handleEvent', eventType);
        // Safety check: if map or sceneRenderer is destroyed, return directly
        // 安全检查：如果map或sceneRenderer已销毁，直接返回
        if (!map || !map.sceneRenderer)
            return;
        // Check if event should be ignored
        // 检查是否应该忽略该事件
        if (this._shouldIgnoreEvent(eventType))
            return;
        // Check if there are OverlayLayers first (only for move related events to avoid unnecessary raycasting)
        // 先判断是否有 OverlayLayer（仅移动相关事件才做这一层判断，避免无必要的射线检测）
        if (eventType === 'mousemove' ||
            eventType === 'mouseenter' ||
            eventType === 'mouseleave' ||
            eventType === 'mouseover' ||
            eventType === 'mouseout' ||
            eventType === 'touchmove') {
            const hasOverlay = map.getLayers()
                .some(l => !l.isSceneLayer && l._feaList?.length > 0);
            if (!hasOverlay)
                return; // No feature, no need to check ray 没有要素就没必要查射线
        }
        // Get event position
        // 获取事件位置
        const position = map._getPointerPosition(domEvent);
        if (!position)
            return;
        // Find all Features at this position
        // 找出该位置的所有Feature
        const features = map._queryFeaturesAt(position);
        // _queryFeaturesAt internally filters tile and other non-Feature objects
        // _queryFeaturesAt 内部已过滤 tile 等非 Feature 对象
        if (features.length === 0)
            return;
        const topFeature = features[0].feature; // Top Feature 最上层的Feature
        // // Temporarily ignore city models because binding events causes stuttering/frame drops
        // // 暂时忽略掉建筑模型，因为绑定事件会卡顿掉帧
        // if ((topFeature._iscity)) return;  
        // Handle different types of events
        // 处理不同类型的事件
        switch (eventType) {
            case 'click':
                this._handleClickEvent(topFeature, domEvent);
                break;
            // Mouse / Touch move related events
            // 鼠标 / 触摸移动相关事件
            case 'mousemove':
            case 'mouseenter':
            case 'mouseleave':
            case 'mouseover':
            case 'mouseout':
            case 'touchmove':
                this.handleMoveEvent(topFeature, domEvent);
                break;
            // Other events (dblclick / mousedown / mouseup / contextmenu / touchstart / touchend ...)
            // 其它事件（dblclick / mousedown / mouseup / contextmenu / touchstart / touchend ...）
            default:
                if (topFeature) {
                    this._fireFeatureEvent(topFeature, eventType, domEvent);
                    const layer = topFeature.getLayer();
                    if (layer) {
                        layer.fire('feature' + eventType, {
                            feature: topFeature,
                            domEvent,
                            type: 'feature' + eventType
                        });
                    }
                }
        }
    }
    /**
     * Handle click event
     * 处理点击事件
     *
     * @param feature Clicked Feature
     *                点击的Feature
     * @param domEvent Original DOM event
     *                 原始DOM事件
     */
    _handleClickEvent(feature, domEvent) {
        if (!feature)
            return;
        this._fireFeatureEvent(feature, 'click', domEvent);
        // Bubble to layer
        // 冒泡到图层
        const layer = feature.getLayer();
        if (layer) {
            layer.fire('featureclick', {
                feature,
                domEvent,
                type: 'featureclick'
            });
        }
    }
    /**
     * Handle move event (includes mouseenter/leave)
     * 处理移动事件（包含mouseenter/leave）
     *
     * @param feature Feature under mouse
     *                鼠标下的Feature
     * @param domEvent Original DOM event
     *                 原始DOM事件
     */
    handleMoveEvent(feature, domEvent) {
        if (!feature)
            return;
        this._fireFeatureEvent(feature, domEvent.type, domEvent);
        // Bubble to layer
        // 冒泡到图层
        const layer = feature.getLayer();
        if (layer) {
            layer.fire('feature' + domEvent.type, {
                feature,
                domEvent,
                type: 'feature' + domEvent.type
            });
        }
    }
    /**
     * Fire Feature event
     * 触发Feature事件
     * @param feature Feature triggering the event 触发事件的Feature
     * @param eventType Event type 事件类型
     * @param domEvent Original DOM event 原始DOM事件
     */
    _fireFeatureEvent(feature, eventType, domEvent) {
        const map = this.target;
        // Safety check: if map, tilemap or sceneRenderer is destroyed, return directly
        // 安全检查：如果map、tilemap或sceneRenderer已销毁，直接返回
        if (!map || !map.sceneRenderer)
            return;
        // Compatible with touch events, construct required parameters for getLocalFromMouse
        // 兼容触摸事件，构造 getLocalFromMouse 所需参数
        let baseEvent = domEvent;
        let screenX;
        let screenY;
        if ('touches' in domEvent) {
            const touch = domEvent.touches[0] || domEvent.changedTouches[0];
            if (!touch)
                return;
            baseEvent = {
                currentTarget: domEvent.currentTarget,
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            screenX = touch.screenX;
            screenY = touch.screenY;
        }
        else {
            const mouseEvt = domEvent;
            baseEvent = mouseEvt;
            screenX = mouseEvt.screenX;
            screenY = mouseEvt.screenY;
        }
        const latlnt = getLocalFromMouse(baseEvent, map, map.sceneRenderer.camera);
        if (!latlnt)
            return;
        const coordinate = [latlnt.x, latlnt.y, latlnt.z];
        const eventData = {
            target: feature,
            originEvent: domEvent,
            coordinate,
            eventName: eventType,
            screenXY: {
                X: screenX,
                Y: screenY,
            }
        };
        feature.fire(eventType, eventData);
    }
    // ============== Utility Methods 工具方法 ==============
    /**
     * Check if event should be ignored
     * 检查是否应该忽略该事件
     * @param eventType Event type for special judgment 事件类型，用于特殊判断
     */
    _shouldIgnoreEvent(eventType) {
        const map = this.target;
        // Safety check: if sceneRenderer is destroyed, ignore event
        // 安全检查：如果sceneRenderer已销毁，忽略事件
        if (!map.sceneRenderer)
            return true;
        // mousedown/touchstart events are not affected by isInteracting, allow feature interaction priority
        // because isInteracting might just be set to true by camera controller
        // mousedown/touchstart 事件不受 isInteracting 影响，允许要素交互优先
        // 因为此时 isInteracting 可能刚被相机控制器设置为 true
        if (eventType === 'mousedown' || eventType === 'touchstart') {
            return false;
        }
        // Map is interacting (e.g. dragging, zooming)
        // 地图正在交互中（如拖动、缩放）
        if (map.isInteracting)
            return true;
        // Other ignore conditions...todo
        // 其他忽略条件...todo
        return false;
    }
}
Map.mergeOptions({
    'FeatureEvents': true,
    'onlyVisibleFeatureEvents': true
});
Map.addOnLoadHook('addHandler', 'FeatureEvents', MapFeatureEventsHandler);
export default MapFeatureEventsHandler;
