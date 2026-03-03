import { Vector3, Raycaster, Vector2 } from 'three';
import Handler from '../Handler';
import { EditHandle } from './EditHandle';
import { Point } from '../../feature/Point';
import { LineString } from '../../feature/LineString';
import { Polygon } from '../../feature/Polygon';
import { getLocalFromMouse } from '../../utils/tilemaputils';
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
export class FeatureEditHandler extends Handler {
    /**
     * Create feature edit handler instance
     * 创建要素编辑处理器实例
     *
     * @param target - Feature to edit 要编辑的要素
     * @param options - Edit options 编辑配置选项
     */
    constructor(target, options) {
        super(target);
        /** Edit options 编辑配置选项 */
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Edit handles array 编辑手柄数组 */
        Object.defineProperty(this, "_handles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        /** Middle handles array (for inserting new vertices) 中点手柄数组（用于插入新顶点） */
        Object.defineProperty(this, "_middleHandles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        /** Middle handle color (translucent) 中点手柄颜色（半透明） */
        Object.defineProperty(this, "_middleHandleColor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'rgba(255, 255, 255, 0.6)'
        });
        /** Whether is editing 是否正在编辑 */
        Object.defineProperty(this, "_editing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Feature shadow copy 要素的影子副本 */
        Object.defineProperty(this, "_shadow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Initial coordinate snapshot of shadow copy (for cancelling edit) 影子副本的初始坐标快照（用于取消编辑） */
        Object.defineProperty(this, "_shadowSnapshot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Whether is updating (to avoid recursive triggers) 是否正在更新（用于避免重复触发） */
        Object.defineProperty(this, "_updating", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Edit history records 编辑历史记录 */
        Object.defineProperty(this, "_history", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        /** Current history index 当前历史记录索引 */
        Object.defineProperty(this, "_historyIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        /** Original draggable state before dragging 拖拽前的原始draggable状态 */
        Object.defineProperty(this, "_draggableOriginalState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Bound event handlers 绑定的事件处理函数 */
        Object.defineProperty(this, "_boundOnMapMouseMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_boundOnMapClick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_boundOnMapMouseDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_boundOnFeatureDragging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_boundOnFeatureDragEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // 合并默认配置
        this.options = {
            handleSize: options?.handleSize ?? 8,
            handleColor: options?.handleColor ?? '#ffffff',
            showMiddleHandles: options?.showMiddleHandles ?? false,
            maxHistorySize: options?.maxHistorySize ?? 20,
            removeVertexOn: options?.removeVertexOn ?? 'contextmenu'
        };
        // 绑定事件处理函数
        this._boundOnMapMouseMove = this._onMapMouseMove.bind(this);
        this._boundOnMapClick = this._onMapClick.bind(this);
        this._boundOnMapMouseDown = this._onMapMouseDown.bind(this);
        this._boundOnFeatureDragging = this._onFeatureDragging.bind(this);
        this._boundOnFeatureDragEnd = this._onFeatureDragEnd.bind(this);
    }
    /**
     * Enable editor
     * 启用编辑器
     */
    enable() {
        if (this._editing) {
            return this;
        }
        super.enable();
        this._editing = true;
        // 参考 创建 shadow 副本进行编辑
        this._createShadow();
        // 保存要素原始状态（用于取消编辑）
        this._saveSnapshot();
        // 降低要素不透明度，使编辑手柄更明显
        this._setFeatureEditingStyle(true);
        // 创建编辑手柄
        this._createHandles();
        // 触发编辑开始事件
        this.target.fire('editstart');
        // 启用拖拽（如果之前未启用）
        this._draggableOriginalState = this.target.options.draggable || false;
        if (!this._draggableOriginalState) {
            this.target.options.draggable = true;
            if (this.target['draggable']) {
                this.target['draggable'].enable();
            }
        }
        return this;
    }
    /**
     * Disable editor
     * 禁用编辑器
     */
    disable() {
        if (!this._editing) {
            return this;
        }
        super.disable();
        this._editing = false;
        // 移除所有手柄
        this._clearHandles();
        // 恢复要素样式
        this._setFeatureEditingStyle(false);
        // 恢复原始拖拽状态
        if (!this._draggableOriginalState) {
            this.target.options.draggable = false;
            if (this.target['draggable']) {
                this.target['draggable'].disable();
            }
        }
        this._draggableOriginalState = false;
        // 将 shadow 的修改同步回原要素
        this._updateCoordFromShadow();
        // 清理影子副本
        this._removeShadow();
        // 触发编辑结束事件
        this.target.fire('editend');
        return this;
    }
    /**
     * Add event hooks
     * 添加事件钩子
     */
    addHooks() {
        // 监听地图事件
        const map = this._getMap();
        if (map) {
            map.on('mousemove', this._boundOnMapMouseMove);
            map.on('click', this._boundOnMapClick);
            // 使用捕获阶段监听 mousedown，以优先处理手柄点击，防止事件传递给要素
            if (map.sceneRenderer.container) {
                map.sceneRenderer.container.addEventListener('mousedown', this._boundOnMapMouseDown, true);
            }
            //监听右键事件用于删除顶点
            if (this.options.removeVertexOn === 'contextmenu') {
                map.on('contextmenu', this._boundOnMapClick);
            }
        }
        // 监听要素拖拽事件
        this.target.on('dragging', this._boundOnFeatureDragging);
        this.target.on('dragend', this._boundOnFeatureDragEnd);
    }
    /**
     * Remove event hooks
     * 移除事件钩子
     */
    removeHooks() {
        // 取消地图事件监听
        const map = this._getMap();
        if (map) {
            map.off('mousemove', this._boundOnMapMouseMove);
            map.off('click', this._boundOnMapClick);
            if (map.sceneRenderer.container) {
                map.sceneRenderer.container.removeEventListener('mousedown', this._boundOnMapMouseDown, true);
            }
            if (this.options.removeVertexOn === 'contextmenu') {
                map.off('contextmenu', this._boundOnMapClick);
            }
        }
        // 取消要素拖拽事件监听
        this.target.off('dragging', this._boundOnFeatureDragging);
        this.target.off('dragend', this._boundOnFeatureDragEnd);
    }
    /**
     * Check if is editing
     * 检查是否正在编辑
     */
    isEditing() {
        return this._editing;
    }
    /**
     * Create shadow copy
     * 创建影子副本
     * @description  shadow mechanism, edit on the copy shadow 机制，在副本上进行编辑
     * @private
     */
    _createShadow() {
        // Terra-GL 暂不使用完整的 shadow feature 副本
        // 直接在原 feature 上编辑，但保存快照用于撤销
        // TODO: 未来可以考虑完整的 shadow 机制（需要图层支持）
        this._shadow = null;
    }
    /**
     * Remove shadow copy
     * 移除影子副本
     * @private
     */
    _removeShadow() {
        if (this._shadow) {
            // 如果有 shadow，移除它
            // this._shadow.remove();
            this._shadow = null;
        }
        this._shadowSnapshot = null;
    }
    /**
     * Sync coordinates from shadow copy to original feature
     * 从影子副本同步坐标到原要素
     * @description  _updateCoordFromShadow
     * @param updateGeometry Whether to update geometry 是否更新几何体
     * @private
     */
    _updateCoordFromShadow(updateGeometry = false) {
        // Terra-GL 当前直接编辑原 feature
        // 如果未来实现完整 shadow 机制，这里同步坐标
        if (updateGeometry && !this._updating) {
            this.target._refreshCoordinates();
        }
    }
    /**
     * Save current state snapshot
     * 保存当前状态快照
     * @private
     */
    _saveSnapshot() {
        const geo = this.target._geometry;
        this._shadowSnapshot = {
            type: geo.type,
            coordinates: JSON.parse(JSON.stringify(geo.coordinates))
        };
        // 保存到历史记录
        this._addHistory(geo.coordinates);
    }
    /**
     * Add to history
     * 添加到历史记录
     * @private
     */
    _addHistory(coordinates) {
        // 移除当前索引之后的历史记录
        if (this._historyIndex < this._history.length - 1) {
            this._history = this._history.slice(0, this._historyIndex + 1);
        }
        // 添加新记录
        this._history.push({
            coordinates: JSON.parse(JSON.stringify(coordinates)),
            timestamp: Date.now()
        });
        // 限制历史记录数量
        if (this._history.length > this.options.maxHistorySize) {
            this._history.shift();
        }
        else {
            this._historyIndex++;
        }
    }
    /**
     * Undo edit
     * 撤销编辑
     */
    undo() {
        if (this._historyIndex > 0) {
            this._historyIndex--;
            const item = this._history[this._historyIndex];
            this._restoreCoordinates(item.coordinates);
            this.target.fire('editundo');
        }
        return this;
    }
    /**
     * Redo edit
     * 重做编辑
     */
    redo() {
        if (this._historyIndex < this._history.length - 1) {
            this._historyIndex++;
            const item = this._history[this._historyIndex];
            this._restoreCoordinates(item.coordinates);
            this.target.fire('editredo');
        }
        return this;
    }
    /**
     * Restore coordinates
     * 恢复坐标
     * @private
     */
    _restoreCoordinates(coordinates) {
        const geo = this.target._geometry;
        geo.coordinates = JSON.parse(JSON.stringify(coordinates));
        // 更新要素几何（使用快速更新）
        this.target._refreshCoordinates();
        // 更新编辑手柄位置
        this._updateHandlePositions();
    }
    /**
     * Cancel edit (restore to state before editing)
     * 取消编辑（恢复到编辑前的状态）
     */
    cancel() {
        if (this._shadowSnapshot) {
            this._restoreCoordinates(this._shadowSnapshot.coordinates);
        }
        this.disable();
        return this;
    }
    /**
     * Create edit handles
     * 创建编辑手柄
     * @private
     */
    _createHandles() {
        const geo = this.target._geometry;
        const map = this._getMap();
        if (!map) {
            console.warn('[FeatureEditHandler] No map found, cannot create handles');
            return;
        }
        // 根据要素类型创建手柄
        if (this.target instanceof Point) {
            this._createPointHandles(geo, map);
        }
        else if (this.target instanceof LineString) {
            this._createLineStringHandles(geo, map);
        }
        else if (this.target instanceof Polygon) {
            this._createPolygonHandles(geo, map);
        }
        // TODO: 支持更多几何类型（MultiPoint, MultiLineString 等）
    }
    /**
     * Create edit handles for Point feature
     * 创建点要素的编辑手柄
     * @private
     */
    _createPointHandles(geo, map) {
        const coord = geo.coordinates;
        const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
        const handle = new EditHandle({
            position: worldPos,
            index: 0,
            symbol: 0, // 顶点
            size: this.options.handleSize,
            color: this.options.handleColor
        }, map);
        // 监听手柄拖拽事件
        handle.on('dragstart', (e) => {
            this._onHandleDragStart(e, 0);
        });
        handle.on('dragging', (e) => {
            this._onHandleDragging(e, 0);
        });
        handle.on('dragend', (e) => {
            this._onHandleDragEnd(e, 0);
        });
        this._handles.push(handle);
    }
    /**
     * Create edit handles for LineString feature
     * 创建线要素的编辑手柄
     * @private
     */
    _createLineStringHandles(geo, map) {
        const coords = geo.coordinates;
        // 为每个顶点创建手柄
        coords.forEach((coord, index) => {
            const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
            const handle = new EditHandle({
                position: worldPos,
                index: index,
                symbol: 0, // 顶点
                size: this.options.handleSize,
                color: this.options.handleColor
            }, map);
            // 监听手柄拖拽事件
            handle.on('dragstart', (e) => {
                this._onHandleDragStart(e, index);
            });
            handle.on('dragging', (e) => {
                this._onHandleDragging(e, index);
            });
            handle.on('dragend', (e) => {
                this._onHandleDragEnd(e, index);
            });
            this._handles.push(handle);
        });
        // 创建中点手柄（用于插入新顶点）
        if (this.options.showMiddleHandles) {
            this._createLineStringMiddleHandles(coords, map);
        }
    }
    /**
     * Handle handle dragging
     * 手柄拖拽中的处理
     * @description  onHandleDragging
     * @private
     */
    _onHandleDragging(event, index) {
        this._updating = true;
        const map = this._getMap();
        if (!map) {
            return;
        }
        // 直接使用事件中的地理坐标，避免重复转换
        // Use geographic coordinate directly from event, avoiding redundant conversion
        const coordinate = event.coordinate;
        if (!coordinate || coordinate.length < 2) {
            this._updating = false;
            return;
        }
        // 获取原始顶点的高度，保持一致
        // Get original vertex altitude to maintain consistency
        const geo = this.target._geometry;
        let originalAlt = 0;
        if (this.target instanceof Point) {
            originalAlt = geo.coordinates[2] || 0;
        }
        else if (this.target instanceof LineString) {
            const coords = geo.coordinates;
            originalAlt = coords[index]?.[2] || 0;
        }
        // 使用原始高度或事件中的高度
        // Use original altitude or altitude from event
        const geoPos = {
            x: coordinate[0],
            y: coordinate[1],
            z: originalAlt
        };
        // 更新要素坐标
        if (this.target instanceof Point) {
            geo.coordinates = [geoPos.x, geoPos.y, geoPos.z];
        }
        else if (this.target instanceof LineString) {
            geo.coordinates[index] = [geoPos.x, geoPos.y, geoPos.z];
        }
        // 快速更新要素几何（不重建）
        this.target._refreshCoordinates();
        // 更新手柄位置（当前拖拽的手柄由EditHandle自己管理）
        if (this.target instanceof LineString) {
            this._updateHandlePositions();
            // 更新中点手柄位置
            if (this.options.showMiddleHandles) {
                this._updateMiddleHandlePositions();
            }
        }
        // 触发编辑事件
        this.target.fire('handledragging', {
            index: index,
            coordinate: [geoPos.x, geoPos.y, geoPos.z]
        });
        // 保持兼容性，同时触发 editing 事件
        this.target.fire('editing', {
            index: index,
            coordinate: [geoPos.x, geoPos.y, geoPos.z]
        });
        this._updating = false;
    }
    /**
     * Handle handle drag start
     * 手柄拖拽开始的处理
     * @description  onHandleDragstart
     * @private
     */
    _onHandleDragStart(event, index) {
        this._updating = true;
        // 触发手柄拖拽开始事件
        this.target.fire('handledragstart', {
            index: index,
            coordinate: event.coordinate
        });
    }
    /**
     * Handle handle drag end
     * 手柄拖拽结束的处理
     * @description onHandleDragEnd
     * @private
     */
    _onHandleDragEnd(_event, index) {
        this._updating = false;
        const geo = this.target._geometry;
        // 保存到历史记录
        this._addHistory(geo.coordinates);
        // 触发手柄拖拽结束事件
        this.target.fire('handledragend', {
            index: index,
            coordinate: this.target instanceof Point
                ? geo.coordinates
                : geo.coordinates[index]
        });
        // 保持兼容性，同时触发 editvertex 事件
        this.target.fire('editvertex', {
            index: index,
            coordinate: this.target instanceof Point
                ? geo.coordinates
                : geo.coordinates[index]
        });
    }
    /**
     * Create polygon edit handles
     * 创建多边形编辑手柄
     * @description createPolygonEditor
     * @private
     */
    _createPolygonHandles(geo, map) {
        const coords = geo.coordinates;
        if (!coords || !Array.isArray(coords) || coords.length === 0) {
            console.warn('[FeatureEditHandler] Invalid polygon coordinates');
            return;
        }
        // Polygon 的 coordinates 是一个二维数组：[[ring1], [hole1], [hole2], ...]
        // ring1 是外环，holes 是内环（洞）
        const rings = coords;
        // 处理每个环（首先是外环，然后是洞）
        rings.forEach((ring, ringIndex) => {
            if (!ring || ring.length < 3) {
                return; // 多边形至少需3个顶点
            }
            // 多边形的首尾点是重复的，需要去除最后一个点
            const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
                ring[0][1] === ring[ring.length - 1][1]
                ? ring.length - 1
                : ring.length;
            // 为每个顶点创建手柄
            for (let i = 0; i < vertexCount; i++) {
                const coord = ring[i];
                const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
                const handle = new EditHandle({
                    position: worldPos,
                    index: i,
                    symbol: 0, // 顶点
                    size: this.options.handleSize,
                    color: this.options.handleColor
                }, map);
                // 保存 ringIndex 信息
                handle._ringIndex = ringIndex;
                // 监听手柄拖拽事件
                handle.on('dragstart', (e) => {
                    this._onPolygonHandleDragStart(e, i, ringIndex);
                });
                handle.on('dragging', (e) => {
                    this._onPolygonHandleDragging(e, i, ringIndex);
                });
                handle.on('dragend', (e) => {
                    this._onPolygonHandleDragEnd(e, i, ringIndex);
                });
                this._handles.push(handle);
            }
            // 创建中点手柄（用于插入新顶点）
            if (this.options.showMiddleHandles) {
                this._createPolygonMiddleHandles(ring, ringIndex, map);
            }
        });
    }
    /**
     * Handle polygon handle drag start
     * 多边形手柄拖拽开始
     * @private
     */
    _onPolygonHandleDragStart(event, index, ringIndex) {
        this._updating = true;
        this.target.fire('handledragstart', {
            index: index,
            ringIndex: ringIndex,
            coordinate: event.coordinate
        });
    }
    /**
     * 多边形手柄拖拽中
     * @description  moveVertexHandle
     * @private
     */
    _onPolygonHandleDragging(event, index, ringIndex) {
        const map = this._getMap();
        if (!map) {
            return;
        }
        // 直接使用事件中的地理坐标，避免重复转换
        // Use geographic coordinate directly from event, avoiding redundant conversion
        const coordinate = event.coordinate;
        if (!coordinate || coordinate.length < 2) {
            return;
        }
        // 获取原始顶点的高度，保持一致
        // Get original vertex altitude to maintain consistency
        const geo = this.target._geometry;
        const rings = geo.coordinates; // Polygon coordinates
        let originalAlt = 0;
        if (rings[ringIndex] && rings[ringIndex][index]) {
            originalAlt = rings[ringIndex][index][2] || 0;
        }
        // 使用原始高度
        // Use original altitude
        const geoPos = {
            x: coordinate[0],
            y: coordinate[1],
            z: originalAlt
        };
        // 更新要素坐标
        if (rings[ringIndex] && rings[ringIndex][index]) {
            // 如果是首点，且多边形是闭合的（首尾点重复），先检查是否需要更新尾点
            // If this is the first vertex and the polygon is closed (first = last), check if we need to update the last vertex
            let shouldUpdateLast = false;
            if (index === 0 && rings[ringIndex].length > 1) {
                const lastIndex = rings[ringIndex].length - 1;
                const firstCoord = rings[ringIndex][0];
                const lastCoord = rings[ringIndex][lastIndex];
                // 检查是否真的是闭合的（首尾坐标相同）
                // Check if polygon is truly closed (first and last coordinates are the same)
                shouldUpdateLast =
                    firstCoord[0] === lastCoord[0] &&
                        firstCoord[1] === lastCoord[1] &&
                        (firstCoord[2] || 0) === (lastCoord[2] || 0);
            }
            // 更新当前顶点
            rings[ringIndex][index] = [geoPos.x, geoPos.y, geoPos.z];
            // 如果多边形是闭合的，同时更新尾点以保持闭合
            // If polygon is closed, also update the last vertex to maintain closure
            if (shouldUpdateLast) {
                const lastIndex = rings[ringIndex].length - 1;
                rings[ringIndex][lastIndex] = [geoPos.x, geoPos.y, geoPos.z];
            }
        }
        // 快速更新要素几何（不重建）
        this.target._refreshCoordinates();
        // 更新其他手柄位置（不包括当前正在拖拽的手柄）
        // 注意：当前拖拽的手柄由EditHandle自己管理位置
        this._updateHandlePositions();
        // 更新中点手柄位置
        if (this.options.showMiddleHandles) {
            this._updateMiddleHandlePositions();
        }
        // 触发编辑事件
        this.target.fire('handledragging', {
            index: index,
            ringIndex: ringIndex,
            coordinate: [geoPos.x, geoPos.y, geoPos.z]
        });
        this.target.fire('editing', {
            index: index,
            ringIndex: ringIndex,
            coordinate: [geoPos.x, geoPos.y, geoPos.z]
        });
    }
    /**
     * Handle polygon handle drag end
     * 多边形手柄拖拽结束
     * @private
     */
    _onPolygonHandleDragEnd(_event, index, ringIndex) {
        this._updating = false;
        const geo = this.target._geometry;
        const rings = geo.coordinates;
        // 保存到历史记录
        this._addHistory(geo.coordinates);
        // 触发编辑事件
        this.target.fire('handledragend', {
            index: index,
            ringIndex: ringIndex,
            coordinate: rings[ringIndex]?.[index] || null
        });
        this.target.fire('editvertex', {
            index: index,
            ringIndex: ringIndex,
            coordinate: rings[ringIndex]?.[index] || null
        });
    }
    /**
     * Update handle positions
     * 更新手柄位置
     * @private
     */
    _updateHandlePositions() {
        const geo = this.target._geometry;
        const map = this._getMap();
        if (!map) {
            return;
        }
        if (this.target instanceof Point) {
            const coord = geo.coordinates;
            const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
            if (this._handles[0]) {
                this._handles[0].updatePosition(worldPos);
            }
        }
        else if (this.target instanceof LineString) {
            const coords = geo.coordinates;
            coords.forEach((coord, index) => {
                const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
                if (this._handles[index]) {
                    this._handles[index].updatePosition(worldPos);
                }
            });
        }
        else if (this.target instanceof Polygon) {
            // 处理 Polygon 的多环结构
            const rings = geo.coordinates;
            let handleIndex = 0;
            rings.forEach((ring) => {
                const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
                    ring[0][1] === ring[ring.length - 1][1]
                    ? ring.length - 1
                    : ring.length;
                for (let i = 0; i < vertexCount; i++) {
                    const coord = ring[i];
                    const worldPos = map.lngLatToWorld(new Vector3(coord[0], coord[1], coord[2] || 0));
                    if (this._handles[handleIndex]) {
                        this._handles[handleIndex].updatePosition(worldPos);
                    }
                    handleIndex++;
                }
            });
        }
    }
    /**
     * Clear all handles
     * 清除所有手柄
     * @private
     */
    _clearHandles() {
        // 移除顶点手柄
        this._handles.forEach(handle => handle.remove());
        this._handles = [];
        // 移除中点手柄
        this._middleHandles.forEach(handle => handle.remove());
        this._middleHandles = [];
    }
    /**
     * Handle feature dragging event
     * 处理要素拖拽事件
     * @private
     */
    _onFeatureDragging(_e) {
        // 更新手柄位置
        this._updateHandlePositions();
        // 更新中点手柄位置
        if (this.options.showMiddleHandles) {
            this._updateMiddleHandlePositions();
        }
    }
    /**
     * Handle feature drag end event
     * 处理要素拖拽结束事件
     * @private
     */
    _onFeatureDragEnd(_e) {
        // 保存历史记录
        const geo = this.target._geometry;
        this._addHistory(geo.coordinates);
        // 确保手柄位置正确
        this._updateHandlePositions();
        if (this.options.showMiddleHandles) {
            this._updateMiddleHandlePositions();
        }
    }
    /**
     * Update middle handle positions
     * 更新中点手柄位置
     * @private
     */
    _updateMiddleHandlePositions() {
        const geo = this.target._geometry;
        const map = this._getMap();
        if (!map)
            return;
        let handleIndex = 0;
        if (this.target instanceof LineString) {
            const coords = geo.coordinates;
            for (let i = 0; i < coords.length - 1; i++) {
                if (handleIndex >= this._middleHandles.length)
                    break;
                const coord1 = coords[i];
                const coord2 = coords[i + 1];
                const midCoord = [
                    (coord1[0] + coord2[0]) / 2,
                    (coord1[1] + coord2[1]) / 2,
                    ((coord1[2] || 0) + (coord2[2] || 0)) / 2
                ];
                const worldPos = map.lngLatToWorld(new Vector3(midCoord[0], midCoord[1], midCoord[2]));
                this._middleHandles[handleIndex].updatePosition(worldPos);
                handleIndex++;
            }
        }
        else if (this.target instanceof Polygon) {
            const rings = geo.coordinates;
            rings.forEach((ring) => {
                const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
                    ring[0][1] === ring[ring.length - 1][1]
                    ? ring.length - 1
                    : ring.length;
                for (let i = 0; i < vertexCount; i++) {
                    if (handleIndex >= this._middleHandles.length)
                        break;
                    const nextIndex = (i + 1) % vertexCount;
                    const coord1 = ring[i];
                    const coord2 = ring[nextIndex];
                    const midCoord = [
                        (coord1[0] + coord2[0]) / 2,
                        (coord1[1] + coord2[1]) / 2,
                        ((coord1[2] || 0) + (coord2[2] || 0)) / 2
                    ];
                    const worldPos = map.lngLatToWorld(new Vector3(midCoord[0], midCoord[1], midCoord[2]));
                    this._middleHandles[handleIndex].updatePosition(worldPos);
                    handleIndex++;
                }
            });
        }
    }
    /**
     * Handle map mouse down event
     * 处理地图鼠标按下事件
     * @private
     */
    _onMapMouseDown(e) {
        // 检测是否点击了编辑手柄
        const map = this._getMap();
        if (!map) {
            return;
        }
        // 创建射线检测器
        const raycaster = new Raycaster();
        // 设置更大的阈值，便于点击小对象
        raycaster.params.Points = { threshold: 0.5 };
        // 由于使用原生事件监听(capture=true)，e 就是原生 MouseEvent
        const domEvent = e;
        // 获取 canvas 元素和边界
        const canvas = map.sceneRenderer.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const mouse = new Vector2(((domEvent.clientX - rect.left) / rect.width) * 2 - 1, -((domEvent.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(mouse, map.sceneRenderer.camera);
        // 检测所有手柄碰撞（包括顶点手柄和中点手柄）
        const allHandles = [...this._handles, ...this._middleHandles];
        for (const handle of allHandles) {
            if (handle.intersect(raycaster)) {
                // 计算地理坐标
                const latlnt = getLocalFromMouse({
                    currentTarget: canvas,
                    clientX: domEvent.clientX,
                    clientY: domEvent.clientY
                }, map, map.sceneRenderer.camera);
                if (latlnt) {
                    // 开始拖拽手柄
                    handle.startDrag([latlnt.x, latlnt.y]);
                    // 阻止事件传播，避免触发地图拖拽和要素拖拽
                    // 由于在捕获阶段，这会阻止事件向下传递到 map 和 feature
                    if (domEvent.stopPropagation) {
                        domEvent.stopPropagation();
                    }
                    if (domEvent.stopImmediatePropagation) {
                        domEvent.stopImmediatePropagation();
                    }
                    if (domEvent.preventDefault) {
                        domEvent.preventDefault();
                    }
                }
                return;
            }
        }
    }
    /**
     * Handle map mouse move event
     * 处理地图鼠标移动事件
     * @private
     */
    _onMapMouseMove(_e) {
        // TODO: 实现手柄高亮效果
        // 当鼠标悬停在手柄上时，改变手柄样式
    }
    /**
     * Handle map click event
     * 处理地图点击事件
     * @description Implement vertex removal functionality 实现顶点删除功能
     * @private
     */
    _onMapClick(e) {
        // 检查是否是删除顶点的触发事件
        const isRemoveEvent = e.type === this.options.removeVertexOn;
        if (!isRemoveEvent) {
            return;
        }
        const map = this._getMap();
        if (!map) {
            return;
        }
        // 创建射线检测器
        const raycaster = new Raycaster();
        raycaster.params.Points = { threshold: 0.5 };
        const domEvent = e.originEvent;
        if (!domEvent) {
            return;
        }
        const mouse = new Vector2((domEvent.offsetX / map.sceneRenderer.renderer.domElement.clientWidth) * 2 - 1, -(domEvent.offsetY / map.sceneRenderer.renderer.domElement.clientHeight) * 2 + 1);
        raycaster.setFromCamera(mouse, map.sceneRenderer.camera);
        // 检测是否点击了手柄
        for (let i = 0; i < this._handles.length; i++) {
            const handle = this._handles[i];
            if (handle.intersect(raycaster)) {
                // 删除顶点
                this._removeVertex(i);
                // 阻止事件传播
                if (domEvent.stopPropagation) {
                    domEvent.stopPropagation();
                }
                if (domEvent.preventDefault) {
                    domEvent.preventDefault();
                }
                return;
            }
        }
    }
    /**
     * Set feature editing style
     * 设置要素编辑模式下的样式
     * @private
     */
    _setFeatureEditingStyle(editing) {
        const threeGeom = this.target._renderObject;
        if (!threeGeom)
            return;
        // 遍历要素的所有mesh和line
        threeGeom.traverse((obj) => {
            if (obj.material) {
                if (editing) {
                    // 编辑模式:降低不透明度，但不改renderOrder
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((mat) => {
                            if (!mat.userData._originalOpacity) {
                                mat.userData._originalOpacity = mat.opacity;
                            }
                            mat.opacity = Math.min(mat.opacity * 0.8, 0.8);
                            mat.transparent = true;
                        });
                    }
                    else {
                        if (!obj.material.userData._originalOpacity) {
                            obj.material.userData._originalOpacity = obj.material.opacity;
                        }
                        obj.material.opacity = Math.min(obj.material.opacity * 0.8, 0.8);
                        obj.material.transparent = true;
                    }
                }
                else {
                    // 恢复原始样式
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((mat) => {
                            if (mat.userData._originalOpacity !== undefined) {
                                mat.opacity = mat.userData._originalOpacity;
                                delete mat.userData._originalOpacity;
                            }
                        });
                    }
                    else {
                        if (obj.material.userData._originalOpacity !== undefined) {
                            obj.material.opacity = obj.material.userData._originalOpacity;
                            delete obj.material.userData._originalOpacity;
                        }
                    }
                }
            }
        });
    }
    /**
     * Remove vertex
     * 删除顶点
     * @description removeVertex
     * @private
     */
    _removeVertex(handleIndex) {
        const geo = this.target._geometry;
        const handle = this._handles[handleIndex];
        const vertexIndex = handle.getIndex();
        const ringIndex = handle._ringIndex || 0;
        // 保存删除前的坐标（用于事件）
        let removedCoordinate = null;
        // 根据要素类型处理删除
        if (this.target instanceof LineString) {
            const coords = geo.coordinates;
            // LineString 至少需要2个顶点
            if (coords.length <= 2) {
                console.warn('[FeatureEditHandler] LineString requires at least 2 vertices');
                return;
            }
            // 保存删除的坐标
            removedCoordinate = coords[vertexIndex];
            // 删除顶点
            coords.splice(vertexIndex, 1);
        }
        else if (this.target instanceof Polygon) {
            const rings = geo.coordinates;
            const ring = rings[ringIndex];
            if (!ring) {
                return;
            }
            // 检查是否首尾闭合
            const isClosed = ring.length > 1 &&
                ring[0][0] === ring[ring.length - 1][0] &&
                ring[0][1] === ring[ring.length - 1][1];
            // Polygon 至少需要3个顶点（不含闭合点）
            const minVertices = isClosed ? 4 : 3;
            if (ring.length <= minVertices) {
                console.warn('[FeatureEditHandler] Polygon ring requires at least 3 vertices');
                return;
            }
            // 保存删除的坐标
            removedCoordinate = ring[vertexIndex];
            // 删除顶点
            ring.splice(vertexIndex, 1);
            // 如果删除的是首点，更新尾点（保持闭合）
            if (isClosed && vertexIndex === 0 && ring.length > 0) {
                ring[ring.length - 1] = [...ring[0]];
            }
        }
        else {
            // Point 类型不支持删除顶点
            return;
        }
        // 更新几何体
        this.target._refreshCoordinates();
        // 移除手柄
        handle.remove();
        this._handles.splice(handleIndex, 1);
        // 更新剩余手柄的索引
        this._updateHandleIndices();
        // 保存到历史记录
        this._addHistory(geo.coordinates);
        // 触发删除事件
        this.target.fire('handleremove', {
            index: vertexIndex,
            ringIndex: ringIndex,
            coordinate: removedCoordinate
        });
    }
    /**
     * Create middle handles for LineString
     * 为 LineString 创建中点手柄
     * @description Create middle handles between vertices for inserting new vertices
     * @private
     */
    _createLineStringMiddleHandles(coords, map) {
        // 在每两个顶点之间创建中点手柄
        for (let i = 0; i < coords.length - 1; i++) {
            const coord1 = coords[i];
            const coord2 = coords[i + 1];
            // 计算中点坐标
            const midCoord = [
                (coord1[0] + coord2[0]) / 2,
                (coord1[1] + coord2[1]) / 2,
                ((coord1[2] || 0) + (coord2[2] || 0)) / 2
            ];
            const worldPos = map.lngLatToWorld(new Vector3(midCoord[0], midCoord[1], midCoord[2]));
            const handle = new EditHandle({
                position: worldPos,
                index: i,
                symbol: 1, // 中点
                size: this.options.handleSize,
                color: this._middleHandleColor,
                opacity: 0.6
            }, map);
            // 监听中点手柄点击事件（插入新顶点）
            handle.on('dragstart', (_e) => {
                this._onMiddleHandleClick(i, 'LineString', 0);
            });
            this._middleHandles.push(handle);
        }
    }
    /**
     * Create middle handles for Polygon
     * 为 Polygon 创建中点手柄
     * @private
     */
    _createPolygonMiddleHandles(ring, ringIndex, map) {
        const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
            ring[0][1] === ring[ring.length - 1][1]
            ? ring.length - 1
            : ring.length;
        // 在每两个顶点之间创建中点手柄
        for (let i = 0; i < vertexCount; i++) {
            const nextIndex = (i + 1) % vertexCount;
            const coord1 = ring[i];
            const coord2 = ring[nextIndex];
            // 计算中点坐标
            const midCoord = [
                (coord1[0] + coord2[0]) / 2,
                (coord1[1] + coord2[1]) / 2,
                ((coord1[2] || 0) + (coord2[2] || 0)) / 2
            ];
            const worldPos = map.lngLatToWorld(new Vector3(midCoord[0], midCoord[1], midCoord[2]));
            const handle = new EditHandle({
                position: worldPos,
                index: i,
                symbol: 1, // 中点
                size: this.options.handleSize,
                color: this._middleHandleColor,
                opacity: 0.6
            }, map);
            // 保存 ringIndex
            handle._ringIndex = ringIndex;
            // 监听中点手柄点击事件
            handle.on('dragstart', (_e) => {
                this._onMiddleHandleClick(i, 'Polygon', ringIndex);
            });
            this._middleHandles.push(handle);
        }
    }
    /**
     * Handle middle handle click (insert new vertex)
     * 处理中点手柄点击（插入新顶点）
     * Insert a new vertex at the middle handle position
     * @private
     */
    _onMiddleHandleClick(afterIndex, type, ringIndex) {
        const geo = this.target._geometry;
        const map = this._getMap();
        if (!map) {
            return;
        }
        if (type === 'LineString') {
            const coords = geo.coordinates;
            const coord1 = coords[afterIndex];
            const coord2 = coords[afterIndex + 1];
            // 计算新顶点坐标
            const newCoord = [
                (coord1[0] + coord2[0]) / 2,
                (coord1[1] + coord2[1]) / 2,
                ((coord1[2] || 0) + (coord2[2] || 0)) / 2
            ];
            // 插入新顶点
            coords.splice(afterIndex + 1, 0, newCoord);
        }
        else if (type === 'Polygon') {
            const rings = geo.coordinates;
            const ring = rings[ringIndex];
            if (!ring) {
                return;
            }
            const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
                ring[0][1] === ring[ring.length - 1][1]
                ? ring.length - 1
                : ring.length;
            const nextIndex = (afterIndex + 1) % vertexCount;
            const coord1 = ring[afterIndex];
            const coord2 = ring[nextIndex];
            // 计算新顶点坐标
            const newCoord = [
                (coord1[0] + coord2[0]) / 2,
                (coord1[1] + coord2[1]) / 2,
                ((coord1[2] || 0) + (coord2[2] || 0)) / 2
            ];
            // 插入新顶点
            ring.splice(afterIndex + 1, 0, newCoord);
            // 如果插入在最后，需要更新闭合点
            const isClosed = ring.length > 1 &&
                ring[0][0] === ring[ring.length - 1][0] &&
                ring[0][1] === ring[ring.length - 1][1];
            if (isClosed && afterIndex === vertexCount - 1) {
                ring[ring.length - 1] = [...ring[0]];
            }
        }
        // 更新几何体
        this.target._applyCoordinateChanges(true);
        // 重新创建所有手柄
        this._clearHandles();
        this._createHandles();
        // 保存到历史记录
        this._addHistory(geo.coordinates);
        // 触发插入事件
        this.target.fire('vertexinsert', {
            index: afterIndex + 1,
            ringIndex: ringIndex
        });
    }
    /**
     * 更新手柄索引
     * Update handle indices
     * @private
     */
    _updateHandleIndices() {
        if (this.target instanceof LineString) {
            this._handles.forEach((handle, index) => {
                handle._index = index;
            });
        }
        else if (this.target instanceof Polygon) {
            let handleIndex = 0;
            const geo = this.target._geometry;
            const rings = geo.coordinates;
            rings.forEach((ring, ringIndex) => {
                const vertexCount = ring[0][0] === ring[ring.length - 1][0] &&
                    ring[0][1] === ring[ring.length - 1][1]
                    ? ring.length - 1
                    : ring.length;
                for (let i = 0; i < vertexCount; i++) {
                    if (this._handles[handleIndex]) {
                        this._handles[handleIndex]._index = i;
                        this._handles[handleIndex]._ringIndex = ringIndex;
                    }
                    handleIndex++;
                }
            });
        }
    }
    // /**Fix handle point coordinates (altitude compensation)
    //  * 
    //  * 修正手柄点坐标（tion Convert world coordinates 海o geograph拔c c补ordi偿ates with altitude）compensation
    //  * @description  - Worldcoordinates 
    //  * @param index - Vertex worldPos 世界坐标
    //  * @param index 顶点索 - Ring index (optional)引
    //  * @param ringIndex 环索引（可选）
    //  * @private
    //  */
    // private _fixHandlePointCoordinates(worldPos: Vector3, index: number, ringIndex: number = 0): Vector3 {
    //     const map = this._getMap();
    //     if (!map) {
    //         // 如果没有地图，直接返回原始坐标
    //         return worldPos;
    //     }
    //     const geo = this.target._geometry;
    //     let vertex: number[] | null = null;
    //     // 获取原始顶点坐标
    //     if (this.target instanceof Point) {
    //         vertex = geo.coordinates as number[];
    //     } else if (this.target instanceof LineString) {
    //         const coords = geo.coordinates as number[][];
    //         vertex = coords[index];
    //     } else if (this.target instanceof Polygon) {
    //         const rings = geo.coordinates as number[][][];
    //         if (rings[ringIndex] && rings[ringIndex][index]) {
    //             vertex = rings[ringIndex][index];
    //         }
    //     }
    //     // 如果没有海拔或海拔为0，直接转换
    //     if (!vertex || !vertex[2] || vertex[2] === 0) {
    //         return map.worldToLngLat(worldPos);
    //     }
    //     // TODO: 实现完整的海拔补偿逻辑
    //     const geoPos = map.worldToLngLat(worldPos);
    //     geoPos.z = vertex[2]; // 保持原始海拔
    //     return geoPos;
    // }
    /**
     * Get map instance
     * 获取地图实例
     * @private
     */
    _getMap() {
        return this.target.getMap();
    }
    /**Destroy editor
     * 销毁编辑器
     */
    remove() {
        this.disable();
        this._history = [];
        this._historyIndex = -1;
        this._shadow = null;
        this._shadowSnapshot = null;
        this._boundOnMapMouseMove = null;
        this._boundOnMapClick = null;
        this._boundOnMapMouseDown = null;
    }
}
