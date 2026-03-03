import { Vector3, Sprite, SpriteMaterial, CanvasTexture, Vector2 } from 'three';
import { EventMixin } from '../../core/mixins';
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
export class EditHandle extends EventMixin(Object) {
    /**
     * Create edit handle instance
     * 创建编辑手柄实例
     *
     * @param options - Handle options 手柄配置选项
     * @param map - Map instance 地图实例
     */
    constructor(options, map) {
        super();
        /** Handle options 手柄配置选项 */
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Map instance 所属地图实例 */
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Three.js Sprite object Three.js Sprite 对象 */
        Object.defineProperty(this, "_sprite", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Whether is dragging 是否正在拖拽 */
        Object.defineProperty(this, "_isDragging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Drag start position 拖拽起始位置 */
        Object.defineProperty(this, "_dragStartPosition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Last mouse geographic coordinate 上一次的鼠标地理坐标 */
        Object.defineProperty(this, "_lastCoordinate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Bound event handlers 绑定的事件处理函数 */
        Object.defineProperty(this, "_boundOnMouseMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_boundOnMouseUp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.map = map;
        // 合并默认配置
        this.options = {
            position: options.position,
            index: options.index,
            symbol: options.symbol ?? 0,
            size: options.size ?? 8,
            color: options.color ?? '#ffffff',
            opacity: options.opacity ?? 0.9,
            draggable: options.draggable ?? true
        };
        // 创建 Sprite
        this._createSprite();
        // 绑定事件处理函数
        this._boundOnMouseMove = this._onMouseMove.bind(this);
        this._boundOnMouseUp = this._onMouseUp.bind(this);
    }
    /**
     * Create sprite object for the handle
     * 创建手柄的 Sprite 对象
     * @private
     */
    _createSprite() {
        // 创建 Canvas 纹理 - 固定小尺寸
        const canvasSize = 64; // 恢复为64像素
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const center = canvasSize / 2;
        const radius = canvasSize / 2 - 2; // 留出边距
        // 绘制圆形手柄
        context.clearRect(0, 0, canvas.width, canvas.height);
        // 外边框（深色）
        context.beginPath();
        context.arc(center, center, radius, 0, 2 * Math.PI);
        context.fillStyle = '#000000';
        context.fill();
        // 内部填充（浅色）
        context.beginPath();
        context.arc(center, center, radius - 2, 0, 2 * Math.PI);
        context.fillStyle = this.options.color;
        context.fill();
        // 创建纹理
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        // 创建材质
        const material = new SpriteMaterial({
            map: texture,
            opacity: this.options.opacity,
            transparent: true,
            depthTest: false, // 禁用深度测试，确保手柄始终可见
            depthWrite: false, // 不写入深度缓冲
            sizeAttenuation: true // 启用距离衰减，但在 onBeforeRender 中动态调整 scale
        });
        // 创建 Sprite
        this._sprite = new Sprite(material);
        this._sprite.position.copy(this.options.position);
        // 设置极高的renderOrder，确保手柄显示在所有对象上方
        this._sprite.renderOrder = 999999;
        // 动态更新缩放以保持固定屏幕像素大小
        // 使用世界空间缩放 + 距离补偿，避免 sizeAttenuation: false 可能导致的宽高比问题
        const renderSize = new Vector2();
        this._sprite.onBeforeRender = (renderer, _scene, camera) => {
            if (!this._sprite || !camera)
                return;
            // 获取相机到 Sprite 的距离
            const distance = camera.position.distanceTo(this._sprite.position);
            // 获取绘图缓冲区大小（物理像素）
            renderer.getSize(renderSize);
            // 获取像素比，将配置的像素大小转换为物理像素大小
            const pixelRatio = renderer.getPixelRatio();
            const targetPixelSize = this.options.size * pixelRatio;
            let scale = 1;
            // 透视相机
            if (camera.isPerspectiveCamera) {
                const fov = camera.fov * Math.PI / 180;
                // 视锥体在该距离处的世界高度
                const visibleHeight = 2 * Math.tan(fov / 2) * distance;
                // 计算对应像素大小的世界缩放值
                scale = (targetPixelSize / renderSize.y) * visibleHeight;
            }
            // 正交相机
            else if (camera.isOrthographicCamera) {
                const top = camera.top;
                const bottom = camera.bottom;
                const visibleHeight = Math.abs(top - bottom) / camera.zoom;
                scale = (targetPixelSize / renderSize.y) * visibleHeight;
            }
            this._sprite.scale.set(scale, scale, 1);
        };
        // 存储引用以便后续访问
        this._sprite._editHandle = this;
        // 添加到地图场景
        this.map.sceneRenderer.scene.add(this._sprite);
    }
    /**
     * Update handle position
     * 更新手柄位置
     *
     * @param position - New world position 新的世界坐标位置
     */
    updatePosition(position) {
        this.options.position = position;
        if (this._sprite) {
            this._sprite.position.copy(position);
        }
    }
    /**
     * Get handle position
     * 获取手柄位置
     *
     * @returns Current world position 当前世界坐标位置
     */
    getPosition() {
        return this.options.position.clone();
    }
    /**
     * Get handle index
     * 获取手柄索引
     *
     * @returns Vertex index 顶点索引
     */
    getIndex() {
        return this.options.index;
    }
    /**
     * Get handle symbol
     * 获取手柄符号
     *
     * @returns Symbol identifier (0=vertex, 1=midpoint) 符号标识（0=顶点，1=中点）
     */
    getSymbol() {
        return this.options.symbol;
    }
    /**
     * Get Sprite object
     * 获取 Sprite 对象
     *
     * @returns Sprite instance Sprite 实例
     */
    getSprite() {
        return this._sprite;
    }
    /**
     * Check if mouse intersects with the handle
     * 检测鼠标是否点击到手柄
     *
     * @param raycaster - Raycaster 射线检测器
     * @returns Whether intersected 是否命中
     */
    intersect(raycaster) {
        if (!this._sprite || !this.options.draggable) {
            return false;
        }
        const intersects = raycaster.intersectObject(this._sprite);
        return intersects.length > 0;
    }
    /**
     * Start dragging
     * 开始拖拽
     *
     * @param coordinate - Mouse geographic coordinate 鼠标地理坐标
     */
    startDrag(coordinate) {
        if (!this.options.draggable) {
            return;
        }
        this._isDragging = true;
        this._dragStartPosition = this.options.position.clone();
        this._lastCoordinate = coordinate;
        // 禁止地图平移
        this.map.sceneRenderer.configure('draggable', false);
        // 监听地图的 mousemove 和 mouseup 事件
        this.map.on('mousemove', this._boundOnMouseMove);
        this.map.on('mouseup', this._boundOnMouseUp);
        // Fire dragstart event
        // 触发 dragstart 事件
        this.fire('dragstart', {
            target: this,
            coordinate: coordinate,
            position: this.options.position.clone()
        });
    }
    /**
     * Handle mouse move event
     * 处理鼠标移动事件
     * @private
     */
    _onMouseMove(e) {
        if (!this._isDragging || !this._lastCoordinate) {
            return;
        }
        const currentCoord = e.coordinate;
        if (!currentCoord) {
            return;
        }
        // Get the current handle's geographic position (with original altitude)
        // 获取手柄当前的地理坐标位置（包含原始高度）
        const currentWorldPos = this.options.position.clone();
        const currentGeo = this.map.worldToLngLat(currentWorldPos);
        // Calculate offset in geographic coordinates
        // 计算地理坐标偏移量
        const dx = currentCoord[0] - this._lastCoordinate[0];
        const dy = currentCoord[1] - this._lastCoordinate[1];
        // Apply offset to current position, preserving altitude
        // 将偏移量应用到当前位置，保持高度不变
        const newGeo = new Vector3(currentGeo.x + dx, currentGeo.y + dy, currentGeo.z // Preserve original altitude 保持原始高度
        );
        // Convert back to world coordinates and update handle position
        // 转换回世界坐标并更新手柄位置
        const newWorldPos = this.map.lngLatToWorld(newGeo);
        this.updatePosition(newWorldPos);
        this._lastCoordinate = currentCoord;
        // Fire dragging event
        // 触发 dragging 事件
        this.fire('dragging', {
            target: this,
            coordinate: [newGeo.x, newGeo.y, newGeo.z],
            position: this.options.position.clone(),
            offset: { dx, dy }
        });
    }
    /**
     * Handle mouse up event
     * 处理鼠标释放事件
     * @private
     */
    _onMouseUp(e) {
        if (!this._isDragging) {
            return;
        }
        this._isDragging = false;
        // Restore map panning
        // 恢复地图平移
        this.map.sceneRenderer.configure('draggable', true);
        // Remove event listeners
        // 移除事件监听
        this.map.off('mousemove', this._boundOnMouseMove);
        this.map.off('mouseup', this._boundOnMouseUp);
        // Fire dragend event
        // 触发 dragend 事件
        this.fire('dragend', {
            target: this,
            coordinate: e.coordinate,
            position: this.options.position.clone(),
            startPosition: this._dragStartPosition
        });
        this._dragStartPosition = null;
        this._lastCoordinate = null;
    }
    /**
     * Show handle
     * 显示手柄
     */
    show() {
        if (this._sprite) {
            this._sprite.visible = true;
        }
    }
    /**
     * 隐藏手柄
     */
    hide() {
        if (this._sprite) {
            this._sprite.visible = false;
        }
    }
    /**
     * Destroy handle
     * 销毁手柄
     */
    remove() {
        // 如果正在拖拽，先结束拖拽
        if (this._isDragging) {
            this._isDragging = false;
            this.map.sceneRenderer.configure('draggable', true);
            this.map.off('mousemove', this._boundOnMouseMove);
            this.map.off('mouseup', this._boundOnMouseUp);
        }
        // 移除 Sprite
        if (this._sprite) {
            this.map.sceneRenderer.scene.remove(this._sprite);
            // 清理材质和纹理
            const material = this._sprite.material;
            if (material.map) {
                material.map.dispose();
            }
            material.dispose();
            this._sprite = null;
        }
        // 清理引用
        this._dragStartPosition = null;
        this._lastCoordinate = null;
        this._boundOnMouseMove = null;
        this._boundOnMouseUp = null;
    }
}
