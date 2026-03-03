import { Vector3, Sprite, Raycaster } from 'three';
import { Map } from '../../map';
/**
 * Edit handle configuration options
 * 编辑手柄配置选项
  * @category Handler
 */
export interface EditHandleOptions {
    /** Handle world position 手柄的世界坐标位置 */
    position: Vector3;
    /** Handle index (used to identify vertices) 手柄的索引（用于标识顶点） */
    index: number;
    /** Handle symbol (e.g. 0 for vertex, 1 for midpoint) 手柄的符号（如：0表示顶点，1表示中点） */
    symbol?: number;
    /** Handle size in pixels 手柄大小（像素） */
    size?: number;
    /** Handle color 手柄颜色 */
    color?: string;
    /** Opacity 不透明度 */
    opacity?: number;
    /** Whether it is draggable 是否可拖拽 */
    draggable?: boolean;
}
declare const EditHandle_base: {
    new (...args: any[]): {
        eventClass: import("../..").EventClass;
        on: (type: string, listener: (data?: any) => void) => import("../..").EventClass;
        fire: (type: string, data?: any) => import("../..").EventClass;
        off: (type: string, listener: (...args: any[]) => void) => import("../..").EventClass;
    };
} & ObjectConstructor;
/**
 * Edit handle class
 * 编辑手柄类
 *
 * @description
 * Draggable control point displayed when editing features
 * 用于编辑要素时显示的可拖拽控制点
 * - Rendered using Sprite 使用 Sprite 渲染
 * - Supports drag interaction 支持拖拽交互
 * - Automatically manages position synchronization 自动管理位置同步
 *
 * @example
 * ```typescript
 * const handle = new EditHandle({
 *     position: new Vector3(100, 100, 0),
 *     index: 0,
 *     symbol: 0
 * }, map);
 *
 * handle.on('dragstart', (e) => console.log('Start dragging 开始拖拽', e));
 * handle.on('dragging', (e) => console.log('Dragging 正在拖拽', e));
 * handle.on('dragend', (e) => console.log('End dragging 结束拖拽', e));
 * ```
  * @category Handler
 */
export declare class EditHandle extends EditHandle_base {
    /** Handle options 手柄配置选项 */
    options: Required<EditHandleOptions>;
    /** Map instance 所属地图实例 */
    map: Map;
    /** Three.js Sprite object Three.js Sprite 对象 */
    private _sprite;
    /** Whether is dragging 是否正在拖拽 */
    private _isDragging;
    /** Drag start position 拖拽起始位置 */
    private _dragStartPosition;
    /** Last mouse geographic coordinate 上一次的鼠标地理坐标 */
    private _lastCoordinate;
    /** Bound event handlers 绑定的事件处理函数 */
    private _boundOnMouseMove;
    private _boundOnMouseUp;
    /**
     * Create edit handle instance
     * 创建编辑手柄实例
     *
     * @param options - Handle options 手柄配置选项
     * @param map - Map instance 地图实例
     */
    constructor(options: EditHandleOptions, map: Map);
    /**
     * Create sprite object for the handle
     * 创建手柄的 Sprite 对象
     * @private
     */
    private _createSprite;
    /**
     * Update handle position
     * 更新手柄位置
     *
     * @param position - New world position 新的世界坐标位置
     */
    updatePosition(position: Vector3): void;
    /**
     * Get handle position
     * 获取手柄位置
     *
     * @returns Current world position 当前世界坐标位置
     */
    getPosition(): Vector3;
    /**
     * Get handle index
     * 获取手柄索引
     *
     * @returns Vertex index 顶点索引
     */
    getIndex(): number;
    /**
     * Get handle symbol
     * 获取手柄符号
     *
     * @returns Symbol identifier (0=vertex, 1=midpoint) 符号标识（0=顶点，1=中点）
     */
    getSymbol(): number;
    /**
     * Get Sprite object
     * 获取 Sprite 对象
     *
     * @returns Sprite instance Sprite 实例
     */
    getSprite(): Sprite | null;
    /**
     * Check if mouse intersects with the handle
     * 检测鼠标是否点击到手柄
     *
     * @param raycaster - Raycaster 射线检测器
     * @returns Whether intersected 是否命中
     */
    intersect(raycaster: Raycaster): boolean;
    /**
     * Start dragging
     * 开始拖拽
     *
     * @param coordinate - Mouse geographic coordinate 鼠标地理坐标
     */
    startDrag(coordinate: [number, number]): void;
    /**
     * Handle mouse move event
     * 处理鼠标移动事件
     * @private
     */
    private _onMouseMove;
    /**
     * Handle mouse up event
     * 处理鼠标释放事件
     * @private
     */
    private _onMouseUp;
    /**
     * Show handle
     * 显示手柄
     */
    show(): void;
    /**
     * 隐藏手柄
     */
    hide(): void;
    /**
     * Destroy handle
     * 销毁手柄
     */
    remove(): void;
}
export {};
