import Handler from '../Handler';
import { Feature } from '../../feature/Feature';
/**
 * Feature edit handler configuration options
 * 要素编辑处理器配置选项
  * @category Handler
 */
export interface FeatureEditHandlerOptions {
    /** Edit handle size in pixels 编辑手柄大小（像素） */
    handleSize?: number;
    /** Edit handle color 编辑手柄颜色 */
    handleColor?: string;
    /** Whether to show middle handles (for inserting new vertices) 是否显示中点手柄（用于插入新顶点） */
    showMiddleHandles?: boolean;
    /** Maximum history size 历史记录最大数量 */
    maxHistorySize?: number;
    /** Event to trigger vertex removal 删除顶点的触发事件 */
    removeVertexOn?: 'contextmenu' | 'dblclick' | 'none';
}
/**
 * Feature edit handler
 * 要素编辑处理器
 *
 * @description
 * Provides interactive editing functionality for features:
 * 为要素提供交互式编辑功能：
 * - Displays draggable vertex edit handles 显示可拖拽的顶点编辑手柄
 * - Supports vertex movement, insertion, and deletion 支持顶点移动、插入、删除
 * - Provides undo/redo functionality 提供撤销/重做功能
 * - Updates feature geometry in real-time 实时更新要素几何
 *
 * @example
 * ```typescript
 * // Add editing functionality to a feature
 * // 为要素添加编辑功能
 * feature.startEdit({
 *     handleSize: 12,
 *     handleColor: '#ff0000'
 * });
 *
 * // End editing
 * // 结束编辑
 * feature.endEdit();
 * ```
  * @category Handler
 */
export declare class FeatureEditHandler extends Handler {
    /** Target feature 目标要素 */
    target: Feature;
    /** Edit options 编辑配置选项 */
    options: Required<FeatureEditHandlerOptions>;
    /** Edit handles array 编辑手柄数组 */
    private _handles;
    /** Middle handles array (for inserting new vertices) 中点手柄数组（用于插入新顶点） */
    private _middleHandles;
    /** Middle handle color (translucent) 中点手柄颜色（半透明） */
    private readonly _middleHandleColor;
    /** Whether is editing 是否正在编辑 */
    private _editing;
    /** Feature shadow copy 要素的影子副本 */
    private _shadow;
    /** Initial coordinate snapshot of shadow copy (for cancelling edit) 影子副本的初始坐标快照（用于取消编辑） */
    private _shadowSnapshot;
    /** Whether is updating (to avoid recursive triggers) 是否正在更新（用于避免重复触发） */
    private _updating;
    /** Edit history records 编辑历史记录 */
    private _history;
    /** Current history index 当前历史记录索引 */
    private _historyIndex;
    /** Original draggable state before dragging 拖拽前的原始draggable状态 */
    private _draggableOriginalState;
    /** Bound event handlers 绑定的事件处理函数 */
    private _boundOnMapMouseMove;
    private _boundOnMapClick;
    private _boundOnMapMouseDown;
    private _boundOnFeatureDragging;
    private _boundOnFeatureDragEnd;
    /**
     * Create feature edit handler instance
     * 创建要素编辑处理器实例
     *
     * @param target - Feature to edit 要编辑的要素
     * @param options - Edit options 编辑配置选项
     */
    constructor(target: Feature, options?: FeatureEditHandlerOptions);
    /**
     * Enable editor
     * 启用编辑器
     */
    enable(): this;
    /**
     * Disable editor
     * 禁用编辑器
     */
    disable(): this;
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
     * Check if is editing
     * 检查是否正在编辑
     */
    isEditing(): boolean;
    /**
     * Create shadow copy
     * 创建影子副本
     * @description  shadow mechanism, edit on the copy shadow 机制，在副本上进行编辑
     * @private
     */
    private _createShadow;
    /**
     * Remove shadow copy
     * 移除影子副本
     * @private
     */
    private _removeShadow;
    /**
     * Sync coordinates from shadow copy to original feature
     * 从影子副本同步坐标到原要素
     * @description  _updateCoordFromShadow
     * @param updateGeometry Whether to update geometry 是否更新几何体
     * @private
     */
    private _updateCoordFromShadow;
    /**
     * Save current state snapshot
     * 保存当前状态快照
     * @private
     */
    private _saveSnapshot;
    /**
     * Add to history
     * 添加到历史记录
     * @private
     */
    private _addHistory;
    /**
     * Undo edit
     * 撤销编辑
     */
    undo(): this;
    /**
     * Redo edit
     * 重做编辑
     */
    redo(): this;
    /**
     * Restore coordinates
     * 恢复坐标
     * @private
     */
    private _restoreCoordinates;
    /**
     * Cancel edit (restore to state before editing)
     * 取消编辑（恢复到编辑前的状态）
     */
    cancel(): this;
    /**
     * Create edit handles
     * 创建编辑手柄
     * @private
     */
    private _createHandles;
    /**
     * Create edit handles for Point feature
     * 创建点要素的编辑手柄
     * @private
     */
    private _createPointHandles;
    /**
     * Create edit handles for LineString feature
     * 创建线要素的编辑手柄
     * @private
     */
    private _createLineStringHandles;
    /**
     * Handle handle dragging
     * 手柄拖拽中的处理
     * @description  onHandleDragging
     * @private
     */
    private _onHandleDragging;
    /**
     * Handle handle drag start
     * 手柄拖拽开始的处理
     * @description  onHandleDragstart
     * @private
     */
    private _onHandleDragStart;
    /**
     * Handle handle drag end
     * 手柄拖拽结束的处理
     * @description onHandleDragEnd
     * @private
     */
    private _onHandleDragEnd;
    /**
     * Create polygon edit handles
     * 创建多边形编辑手柄
     * @description createPolygonEditor
     * @private
     */
    private _createPolygonHandles;
    /**
     * Handle polygon handle drag start
     * 多边形手柄拖拽开始
     * @private
     */
    private _onPolygonHandleDragStart;
    /**
     * 多边形手柄拖拽中
     * @description  moveVertexHandle
     * @private
     */
    private _onPolygonHandleDragging;
    /**
     * Handle polygon handle drag end
     * 多边形手柄拖拽结束
     * @private
     */
    private _onPolygonHandleDragEnd;
    /**
     * Update handle positions
     * 更新手柄位置
     * @private
     */
    private _updateHandlePositions;
    /**
     * Clear all handles
     * 清除所有手柄
     * @private
     */
    private _clearHandles;
    /**
     * Handle feature dragging event
     * 处理要素拖拽事件
     * @private
     */
    private _onFeatureDragging;
    /**
     * Handle feature drag end event
     * 处理要素拖拽结束事件
     * @private
     */
    private _onFeatureDragEnd;
    /**
     * Update middle handle positions
     * 更新中点手柄位置
     * @private
     */
    private _updateMiddleHandlePositions;
    /**
     * Handle map mouse down event
     * 处理地图鼠标按下事件
     * @private
     */
    private _onMapMouseDown;
    /**
     * Handle map mouse move event
     * 处理地图鼠标移动事件
     * @private
     */
    private _onMapMouseMove;
    /**
     * Handle map click event
     * 处理地图点击事件
     * @description Implement vertex removal functionality 实现顶点删除功能
     * @private
     */
    private _onMapClick;
    /**
     * Set feature editing style
     * 设置要素编辑模式下的样式
     * @private
     */
    private _setFeatureEditingStyle;
    /**
     * Remove vertex
     * 删除顶点
     * @description removeVertex
     * @private
     */
    private _removeVertex;
    /**
     * Create middle handles for LineString
     * 为 LineString 创建中点手柄
     * @description Create middle handles between vertices for inserting new vertices
     * @private
     */
    private _createLineStringMiddleHandles;
    /**
     * Create middle handles for Polygon
     * 为 Polygon 创建中点手柄
     * @private
     */
    private _createPolygonMiddleHandles;
    /**
     * Handle middle handle click (insert new vertex)
     * 处理中点手柄点击（插入新顶点）
     * Insert a new vertex at the middle handle position
     * @private
     */
    private _onMiddleHandleClick;
    /**
     * 更新手柄索引
     * Update handle indices
     * @private
     */
    private _updateHandleIndices;
    /**
     * Get map instance
     * 获取地图实例
     * @private
     */
    private _getMap;
    /**Destroy editor
     * 销毁编辑器
     */
    remove(): void;
}
