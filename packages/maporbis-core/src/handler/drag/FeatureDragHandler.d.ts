import Handler from "../Handler";
import { Feature } from "../../feature/Feature";
/**
 * Feature drag handler class
 * 要素拖拽处理器类
 * @extends Handler
  * @category Handler
 */
export declare class FeatureDragHandler extends Handler {
    target: Feature;
    private _isDragging;
    private _lastCoord;
    /**
     * Save bound function references to ensure correct removal of event listeners
     * 保存绑定后的函数引用，确保能正确移除事件监听器
     */
    private _boundOnMouseDown;
    private _boundOnMouseMove;
    private _boundOnMouseUp;
    /**
     * Add event hooks
     * 添加事件钩子
     */
    addHooks(): void;
    /**
     * Remove event hooks
     * 移除事件钩子
     */
    removeHooks(): void;
    /**
     * Handle mouse down event
     * 处理鼠标按下事件
     * @param e Event object 事件对象
     */
    private _onMouseDown;
    private _onMouseMove;
    private _onMouseUp;
    /**
     * Stop dragging
     * 停止拖拽
     */
    private _stopDrag;
    /**
     * Translate feature coordinates
     * 平移要素坐标
     * @param dx Longitude offset 经度偏移量
     * @param dy Latitude offset 纬度偏移量
     */
    private _translate;
}
