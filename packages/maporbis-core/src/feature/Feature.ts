import { Point as GeoJSONPoint, MultiPoint as GeoJSONMultiPoint, LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString, Polygon as GeoJSONPolygon, MultiPolygon as GeoJSONMultiPolygon } from 'geojson';
import { Line2 } from 'three-stdlib';
import { Object3D, Vector3, Mesh, Camera, WebGLRenderer, Box3, Vector2 } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { BaseMixin, EventMixin } from "../core/mixins";
import { requireParam } from "../utils/validate";
import { OverlayLayer } from '../layer/OverlayLayer';
import { Layer } from '../layer/Layer';
import { Paint, PaintInput } from '../style/index';
import { v4 as uuidv4 } from 'uuid';
import Handlerable from '../handler/Handlerable';
import { ICollidable } from '../core/collision/interfaces/ICollidable';
import { CollisionType, CollisionReason, IBoundingBox } from '../core/collision/types/CollisionTypes';
import { FeatureDragHandler } from '../handler/drag/FeatureDragHandler';
import { WebGPUCompat } from "../utils/WebGPUCompat";
import { FeaturePaintManager } from './internal/FeatureStyleManager';

import type { Map } from '../map';

/**
 * Feature configuration options.
 * 要素配置选项
  * @category Feature
 */
export type FeatureOptions = {
    /**
     * Feature ID (optional, automatically generated if not provided).
     * 要素ID（可选，不传则自动生成）
     */
    id?: string;
    /**
     * GeoJSON geometry data (required).
     * GeoJSON几何数据（必填）
     */
    geometry?: GeoJSON.Geometry;
    /**
     * Whether the feature is visible (default: true).
     * 是否可见（默认true）
     */
    visible?: boolean;
    /**
     * Default projection coordinate system.
     * 默认投影坐标系
     */
    defaultProjection?: string;
    /**
     * Style configuration.
     * 样式配置
     */
    paint?: PaintInput;
    /**
     * Custom user data.
     * 自定义数据
     */
    userData?: { [key: string]: any };
    /**
     * Rotation angle (in radians).
     * 旋转角度（弧度）
     */
    rotateAngle?: number;
    /**
     * Whether the feature is draggable (default: false).
     * 是否可拖拽（默认false）
     */
    draggable?: boolean;
    /**
     * Whether the feature is editable (default: false).
     * 是否可编辑（默认false）
     */
    editable?: boolean;
}

/**
 * Union type for GeoJSON geometry types.
 * GeoJSON几何类型联合类型
  * @category Feature
 */
export type GeoJSONGeometry =
    | GeoJSONPoint
    | GeoJSONMultiPoint
    | GeoJSONLineString
    | GeoJSONMultiLineString
    | GeoJSONPolygon
    | GeoJSONMultiPolygon;

/**
 * Feature abstract base class.
 * 要素抽象基类
 * 
 * @description
 * Provides basic feature functionality, including:
 * - Geometry data management
 * - Style management
 * - Layer management
 * - Event system
 * - Collision detection and avoidance support
 * 
 * 提供要素的基础功能，包括：
 * - 几何数据管理
 * - 样式管理
 * - 图层管理
 * - 事件系统
 * - 碰撞检测与避让支持
 * 
 * @abstract
 * @extends EventMixin(BaseMixin(Object3D))
 * @implements ICollidable
 * @category Feature
 */
export abstract class Feature extends Handlerable(
    EventMixin(
        BaseMixin<typeof Object3D, any>(Object3D)
    )
) implements ICollidable {
    /**
     * Feature position (single coordinate or array of coordinates).
     * 要素位置（单个坐标或坐标数组）
     */
    _worldCoordinates: Vector3 | Vector3[];
    /**
     * Three.js geometry object.
     * Three.js几何对象
     */
    _renderObject: Object3D | Line2;
    /**
     * GeoJSON geometry data.
     * GeoJSON几何数据
     */
    _geometry: GeoJSONGeometry;
    /**
     * The layer this feature belongs to.
     * 所属图层
     */
    _layer?: Layer;

    /**
     * Current paint.
     * 当前样式
     */
    _paint?: Paint;
    /**
     * Feature ID.
     * 要素ID
     */
    _id: string;
    
    /**
     * Internal paint manager.
     * 内部样式管理器
     */
    private _paintManager: FeaturePaintManager;
    
    /**
     * Internal bloom helper.
     * 内部发光效果辅助器
     */
    
    /**
     * Whether geometry is currently initializing.
     * 是否正在初始化几何体
     */
    private _isGeometryInitializing = false;

    /**
     * Internal collision configuration.
     * 内部碰撞配置
     */
    private _collisionConfig = {
        enabled: false,
        priority: 50,
        padding: 4
    };

    /**
     * Collision state.
     * 碰撞状态
     */
    private _collisionState = {
        visible: true,
        reason: CollisionReason.NO_COLLISION,
        collidedWith: [] as string[],
        timestamp: Date.now()
    };

    /**
     * Animation reference ID.
     */
    private _animationRef: any = null;

    /**
     * Create a feature instance.
     * 创建要素实例
     * 
     * @param options - Feature configuration options. 要素配置选项
     * @throws Throws error if geometry is not provided. 如果未提供geometry参数会抛出错误
     */
    constructor(options: FeatureOptions) {
        super();
        requireParam(options.geometry, "geometry", "geometry must be specified");
        this._geometry = options.geometry as GeoJSONGeometry;
        this._worldCoordinates = new Vector3(0, 0, 0);
        this._renderObject = new Object3D();

        // Initialize options object for Handler use
        this.options = {
            draggable: options.draggable || false,
            editable: options.editable || false
        };

        // Generate feature ID
        if (options.id) {
            this._id = options.id
        } else {
            this._id = uuidv4();
        }
        
        // Initialize internal managers
        this._paintManager = new FeaturePaintManager(
            () => this._renderObject,
            () => this._ensureRenderObjectInScene()
        );
        this._paintManager.setOnPaintApplied((paint) => {
            this._onPaintApplied(paint);
        });
        

        if (options.userData) {
            this.userData = Object.assign(
                {},
                JSON.parse(JSON.stringify(options.userData))
            );
        }
        if (options.paint) {
            this.setPaint(options.paint);
        }
        // Register handler
        this.addHandler('draggable', FeatureDragHandler);
    }

    /**
     * Ensure render object is added to the scene.
     * 确保渲染对象已添加到场景中
     */
    private _ensureRenderObjectInScene(): void {
        if (this._renderObject && !this._renderObject.parent) {
            this.add(this._renderObject);
        }
    }

    /**
     * Apply alpha value to object.
     * 应用透明度值到对象
     * @internal Reserved for collision visibility animation
     */
    // @ts-ignore - Reserved method for alpha transitions
    private _applyAlphaToObject(alpha: number): void {
        (this._renderObject as Object3D)?.traverse?.((child: any) => {
            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                    if (mat && typeof mat.opacity !== 'undefined') {
                        mat.opacity = alpha * (mat.userData?.originalOpacity ?? 1);
                        mat.transparent = mat.opacity < 1;
                        mat.needsUpdate = true;
                    }
                });
            }
        });
    }

    /**
     * Called when paint is successfully applied.
     * 样式成功应用后调用
     */
    private _onPaintApplied(paint: Paint): void {
        // Apply bloom configuration if present
        if (paint.config.bloom !== undefined) {
            this._bloomHelper.applyStyleBloom(paint.config.bloom);
            this._bloomHelper.applyBloomToObject(this._renderObject);
        }
    }

    /**
     * Initialize geometry (template method).
     * 初始化几何体（模板方法）
     * 
     * @description
     * Calls _buildRenderObject implemented by subclasses and processes pending paint changes.
     * 该方法会调用子类实现的_buildRenderObject方法，并处理积压的样式变更
     * 
     * @returns Promise<void>
     */
    async initializeGeometry(): Promise<void> {
        if (this._isGeometryInitializing || this._renderObject) return;
        this._isGeometryInitializing = true;
        try {
            await this._buildRenderObject();
            this._paintManager._tryProcessPaintQueue();
        } finally {
            this._isGeometryInitializing = false;
        }
    }

    /**
     * 构建渲染对象 (Internal)
     * Build the Three.js object for rendering.
     */
    abstract _buildRenderObject(): Promise<void> | void;

    /**
     * 更新渲染对象的坐标 (Internal)
     * Update the coordinates of the render object.
     */
    protected _refreshCoordinates(): void {
        // 默认实现：调用完整重建（子类应该重写此方法以提供更高效的更新）
        this._buildRenderObject();
    }

    /**
     * Set paint.
     * 设置样式
     * 
     * @param input - Paint configuration or paint instance. 样式配置或样式实例
     * @returns Current feature instance (supports method chaining). 当前要素实例（支持链式调用）
     */
    setPaint(input: PaintInput): this {
        this._paint = this._paintManager.enqueuePaint(input);
        return this;
    }

    /**
     * Get current paint.
     * 获取当前样式
     * 
     * @returns Current paint or undefined. 当前样式或undefined
     */
    getPaint(): Paint | undefined {
        return this._paint;
    }

    /**
     * Paint property getter/setter for convenience.
     */
    get paint(): Paint | undefined {
        return this._paint;
    }

    set paint(value: PaintInput | undefined) {
        if (value) {
            this.setPaint(value);
        }
    }


    /**
     * Set bloom status for the current feature.
     * 设置当前要素的发光状态
     * 
     * @param enabled Whether to enable bloom. 是否启用发光
     * @param options Optional: bloom intensity and color. 可选：发光强度和颜色
     */
    setBloom(
        enabled: boolean,
        options?: { intensity?: number; color?: string }
    ): this {
        this._bloomHelper.setBloomConfig(enabled, options);
        this._bloomHelper.applyBloomToObject(this._renderObject);
        return this;
    }

    /**
     * Get bloom configuration of the current feature.
     * 获取当前要素的发光配置
     */
    getBloom(): { enabled: boolean; intensity: number; color: string } | undefined {
        return this._bloomHelper.getBloomConfig();
    }

    /**
     * Add feature to layer
     * 将要素添加到图层
     * 
     * @param layer - Target layer 目标图层
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    addTo<T extends Feature>(layer: OverlayLayer<T>): this {
        layer.addFeature(this as unknown as T);
        return this;
    }

    /**
     * Get parent layer
     * 获取所属图层
     * 
     * @returns Layer instance or null 图层实例或null
     */
    getLayer(): Layer | null {
        return this._layer || null;
    }

    /**
     * Get parent map
     * 获取所属地图
     * 
     * @returns Map instance or null 地图实例或null
     */
    getMap(): Map | null {
        return this._layer ? this._layer.getMap() : null;
    }
    /**
     * Set feature coordinates (geographic coordinates)
     * 设置要素坐标（地理坐标）
     * 
     * @param coordinates - Longitude and latitude coordinates 经纬度坐标
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    setCoordinates(coordinates: any): this {
        // Update GeoJSON data source
        // 更新 GeoJSON 数据源
        (this._geometry as any).coordinates = coordinates;

        // Trigger cleanup and redraw related to coordinate changes
        // 触发坐标变化相关的清理与重绘
        this._applyCoordinateChanges();
        return this;
    }
    /**
     * Internal processing after coordinate change
     * 坐标变化后的内部处理
     * 
     * @param fastUpdate - Whether to use fast update mode (only updates vertex positions, does not rebuild geometry) 是否使用快速更新模式（仅更新顶点位置，不重建几何体）
     */
    protected _applyCoordinateChanges(fastUpdate: boolean = false) {
        if (fastUpdate && this._renderObject) {
            // Fast update mode: only update geometry vertex positions, used for real-time interactions like dragging
            // 快速更新模式：仅更新几何体顶点位置，用于拖拽等实时交互
            this._refreshCoordinates();
        } else {
            // Full update mode: recalculate and rebuild Three.js geometry
            // 完整更新模式：重新计算并重建 Three.js 几何体
            this._buildRenderObject();
        }
        // Trigger event notification
        // 触发事件通知
        this.fire('move');
    }

    /**
     * Get feature center (geographic coordinates)
     * 获取要素中心点（地理坐标）
     * 
     * @returns Center coordinates [lng, lat] 中心点坐标 [经度, 纬度]
     */
    getCenter(): [number, number] {
        // Simple center logic, subclasses can override
        // 简单的中心点逻辑，子类可覆盖
        if (this._geometry.type === 'Point') {
            return (this._geometry as any).coordinates;
        }
        // ... Logic for other types
        // ... 其他类型的中心计算逻辑
        return [0, 0];
    }

    /**
     * Bind to layer (internal use)
     * 绑定到图层（内部使用）
     * 
     * @param layer - Layer instance 图层实例
     * @throws Throws error if feature already belongs to another layer 如果要素已属于其他图层会抛出错误
     */
    _bindLayer(layer: Layer): void {
        if (this._layer && this._layer !== layer) {
            throw new Error('Feature cannot be added to multiple layers');
        }
        this._layer = layer;
    }

    /**
     * Update geometry
     * 更新几何体
     */
    _updateGeometry(): void {
        this._disposeGeometry();
        if (this._renderObject) {
            this._renderObject.position.copy(this._worldCoordinates as any);
            // console.log(this._renderObject, 'renderObject')
            if (this._renderObject?.userData?._type === 'Model') {
                this._renderObject.renderOrder = 0;
            } else {
                this._renderObject.renderOrder = 99;
            }
            this.add(this._renderObject);
            this.updateMatrixWorld(true);
            this._tryProcessQueue();
        }
    }

    /**
     * Try to process paint queue. (Internal)
     * 尝试处理样式队列
     */
    protected _tryProcessQueue(): void {
        this._paintManager._tryProcessPaintQueue();
    }

    /**
     * Remove self from layer
     * 从图层中移除自身
     * 
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    _remove() {
        const layer = this.getLayer();
        if (!layer) {
            return this;
        }
        this._unbind();
        // console.log(this, '移除了要素')
        return this;
    }

    /**
     * Unbind from layer (internal use)
     * 解除图层绑定（内部使用）
     */
    _unbind(): void {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }
        if (layer.onRemoveFeature) {
            layer.onRemoveFeature(this);
        }
        delete this._layer;
    }

    /**
     * Dispose geometry resources
     * 释放几何体资源
     */
    _disposeGeometry(): void {
        if (!this._renderObject) return;
        this.clear();

        WebGPUCompat.safeDispose(() => {
            if ('traverse' in this) {
                (this._renderObject as Object3D).traverse(obj => {
                    if (obj instanceof Mesh) {
                        obj.geometry?.dispose();
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.dispose());
                        } else {
                            obj.material?.dispose();
                        }
                    }
                    else if ('isLine' in obj && obj.isLine) {
                        (obj as any).geometry?.dispose();
                        (obj as any).material?.dispose();
                    }
                });
            }
        });
    }

    // === ICollidable 接口实现 ===

    /**
     * Get whether collision detection is enabled
     * 获取是否启用碰撞检测
     * 
     * @returns Whether collision detection is enabled 是否启用碰撞检测
     */
    get collidable(): boolean {
        return this._collisionConfig.enabled;
    }

    /**
     * Get collision type (subclasses need to override)
     * 获取碰撞类型（子类需要重写）
     * 
     * @returns Collision type 碰撞类型
     */
    get collisionType(): CollisionType {
        return CollisionType.POINT; // 子类重写
    }

    /**
     * Get collision priority
     * 获取碰撞优先级
     * 
     * Priority calculation order:
     * 优先级计算顺序：
     * 1. Priority in user data
     * 1. 用户数据中的优先级
     * 2. Priority in style configuration
     * 2. 样式配置中的优先级
     * 3. Default priority
     * 3. 默认优先级
     * 
     * @returns Collision priority value 碰撞优先级数值
     */
    getCollisionPriority(): number {
        return this.userData.collisionPriority ??        // 用户数据优先级
            this._paint?.config.collisionPriority ??  // 样式配置优先级  
            this._collisionConfig.priority;           // 默认优先级
    }

    /**
     * Get screen space bounding box
     * 获取屏幕空间包围盒
     * 
     * Calculate the bounding box of the feature in screen space for collision detection
     * 计算要素在屏幕空间中的包围盒，用于碰撞检测
     * 
     * @param camera - Current camera 当前相机
     * @param renderer - Renderer instance 渲染器实例
     * @returns Bounding box info or null (if invisible or calculation failed) 包围盒信息或null（如果不可见或计算失败）
     */
    getScreenBoundingBox(camera: Camera, renderer: WebGLRenderer | WebGPURenderer): IBoundingBox | null {
        if (!this.collidable) return null;
        if (!this._renderObject) return null;

        try {
            // 计算世界坐标和屏幕投影
            const worldPos = new Vector3();
            this._renderObject.getWorldPosition(worldPos);
            const screenPos = worldPos.clone().project(camera);

            // 检查是否在屏幕内
            const inFrustum = (
                screenPos.x >= -1.1 && screenPos.x <= 1.1 &&
                screenPos.y >= -1.1 && screenPos.y <= 1.1 &&
                screenPos.z >= -1 && screenPos.z <= 1
            );

            // 如果不可见，直接返回null
            if (!inFrustum) {
                return null;
            }

            // 转换为像素坐标
            const { width, height } = renderer.domElement;
            const pixelX = (screenPos.x * 0.5 + 0.5) * width;
            const pixelY = (-screenPos.y * 0.5 + 0.5) * height;

            // 获取要素特定包围盒
            const bbox = this._calculateCollisionBoundingBox(camera, renderer);
            if (!bbox) return null;

            const boundingBox: IBoundingBox = {
                id: this._id,  // 包围盒ID
                x: pixelX + bbox.offsetX,  // 屏幕X坐标 + 偏移量
                y: pixelY + bbox.offsetY,  // 屏幕Y坐标 + 偏移量  
                width: bbox.width + this._collisionConfig.padding * 2,  // 宽度 + 边距
                height: bbox.height + this._collisionConfig.padding * 2, // 高度 + 边距
                priority: this.getCollisionPriority(),  // 动态优先级
                featureId: this._id,      // 关联的要素ID
                layerId: this._layer?.getId() || 'unknown',  // 图层ID
                type: this.collisionType,  // 碰撞类型
                data: this.getCollisionData()  // 扩展数据
            };

            return boundingBox;

        } catch (error) {
            console.warn(`Feature ${this._id} 包围盒计算失败:`, error);
            return null;
        }
    }

    /**
     * Set collision visibility
     * 设置碰撞可见性
     * 
     * Control the display state of the feature after collision detection, supporting smooth transition animation
     * 控制要素在碰撞检测后的显示状态，支持平滑过渡动画
     * 
     * @param visible - Whether visible 是否可见
     * @param reason - Reason for visibility change 可见性变化原因
     */
    setCollisionVisibility(visible: boolean, reason: CollisionReason = CollisionReason.MANUAL_HIDDEN): void {
        // 状态无变化检查
        if (this._collisionState.visible === visible) return;

        // 取消之前的动画（如果有）
        if (this._animationRef !== null) {
            cancelAnimationFrame(this._animationRef);
            this._animationRef = null;
        }

        // 直接设置可见性和透明度（移除复杂动画）
        this.visible = visible;
        this._applyFinalAlpha(visible ? 1 : 0);

        // 更新碰撞状态
        this._collisionState = {
            visible,
            reason,
            collidedWith: visible ? [] : this._collisionState.collidedWith,
            timestamp: Date.now()
        };
    }

    /**
     * Get current collision visibility
     * 获取当前碰撞可见性
     * 
     * @returns Current visibility state 当前可见性状态
     */
    getCollisionVisibility(): boolean {
        return this._collisionState.visible;
    }

    // === 避让配置方法 ===

    /**
     * Set collision detection configuration
     * 设置碰撞检测配置
     * 
     * @param config - Collision configuration options 碰撞配置选项
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    setCollisionConfig(config: Partial<typeof this._collisionConfig>): this {
        Object.assign(this._collisionConfig, config);
        return this;
    }

    /**
     * Enable collision detection
     * 启用碰撞检测
     * 
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    enableCollision(): this {
        this._collisionConfig.enabled = true;
        return this;
    }

    /**
     * Disable collision detection
     * 禁用碰撞检测
     * 
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    disableCollision(): this {
        this._collisionConfig.enabled = false;
        this.setCollisionVisibility(true, CollisionReason.MANUAL_HIDDEN);
        return this;
    }

    // === 私有方法 ===

    /**
     * Apply alpha to all child objects
     * 应用透明度到所有子对象
     * 
     * Recursively traverse all child objects, set transparency uniformly, support single and multiple materials
     * 递归遍历所有子对象，统一设置透明度，支持单个和多个材质
     * 
     * @param alpha - Alpha value (0-1) 透明度值（0-1）
     * @private
     */
    private _applyVisibilityAlpha(alpha: number): void {
        this.traverse((child) => {
            if (child instanceof Mesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.opacity !== undefined) mat.opacity = alpha;
                    });
                } else if (child.material.opacity !== undefined) {
                    child.material.opacity = alpha;
                }
            }
        });
    }

    /**
     * Apply final alpha and force update
     * 应用最终透明度并强制更新
     * 
     * @param alpha - Alpha value (0-1) 透明度值（0-1）
     * @private
     */
    private _applyFinalAlpha(alpha: number): void {
        this._applyVisibilityAlpha(alpha);
        // 强制更新材质
        this.traverse((child) => {
            if (child instanceof Mesh) {
                child.material.needsUpdate = true;
            }
        });
    }

    // /**
    //  * 触发碰撞状态变化事件
    //  * 
    //  * @param oldState - 旧状态
    //  * @param newState - 新状态
    //  * @private
    //  */
    // private _fireCollisionStateChange(oldState: ICollisionState, newState: ICollisionState): void {
    //     this.fire('collisionstatechange', {
    //         feature: this,
    //         oldState,
    //         newState,
    //         timestamp: Date.now()
    //     });
    // }

    /**
     * Get collision related data
     * 获取碰撞相关数据
     * 
     * @returns Object containing feature type, user data, and style config 包含要素类型、用户数据、样式配置的对象
     */
    getCollisionData(): any {
        return {
            featureType: this.constructor.name,
            userData: this.userData,
            paintConfig: this._paint?.config
        };
    }

    /**
     * Calculate bounding box for collision detection
     * 计算碰撞检测用的包围盒
     * 
     * pointToLngLat world space bounding box to screen space to calculate pixel-level bounding box
     * 将世界空间包围盒投影到屏幕空间，计算像素级别的包围盒
     * 
     * @param camera - Current camera 当前相机
     * @param renderer - Renderer instance 渲染器实例
     * @returns Bounding box info or null (if calculation failed) 包围盒信息或null（如果计算失败）
     * @private
     */
    _calculateCollisionBoundingBox(camera?: Camera, renderer?: WebGLRenderer | WebGPURenderer): { width: number; height: number; offsetX: number; offsetY: number } | null {
        if (!this.visible || !this._renderObject || !camera || !renderer) return null;

        try {
            // Calculate world space bounding box
            // 计算世界空间包围盒
            const bbox = new Box3().setFromObject(this._renderObject as any);
            if (bbox.isEmpty()) return this._getFallbackBoundingBox();

            // Get 8 corners of the bounding box
            // 获取包围盒的8个角点
            const corners = [
                new Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
                new Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
                new Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
                new Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
                new Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
                new Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
                new Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
                new Vector3(bbox.max.x, bbox.max.y, bbox.max.z)
            ];

            // pointToLngLat corners to screen space
            // 将角点投影到屏幕空间
            const { width: screenWidth, height: screenHeight } = renderer.domElement;
            const screenPoints: Vector2[] = [];

            corners.forEach(corner => {
                // World coordinates -> Normalized Device Coordinates (NDC)
                // 世界坐标 -> 标准化设备坐标 (NDC)
                const ndc = corner.clone().project(camera);

                // NDC -> Screen pixel coordinates
                // NDC -> 屏幕像素坐标
                const screenX = (ndc.x * 0.5 + 0.5) * screenWidth;
                const screenY = (-ndc.y * 0.5 + 0.5) * screenHeight;

                screenPoints.push(new Vector2(screenX, screenY));
            });

            // Calculate bounding box in screen space
            // 计算屏幕空间中的包围盒
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            screenPoints.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });

            const pixelWidth = maxX - minX;
            const pixelHeight = maxY - minY;

            // Add minimum pixel size (ensure clickable)
            // 添加最小像素尺寸（确保可点击）
            const minPixelSize = 4; // Minimum 4 pixels 最小4像素
            const finalWidth = Math.max(pixelWidth, minPixelSize);
            const finalHeight = Math.max(pixelHeight, minPixelSize);

            // Calculate offset relative to feature center
            // 计算相对于要素中心点的偏移
            const worldCenter = new Vector3();
            bbox.getCenter(worldCenter);
            const ndcCenter = worldCenter.clone().project(camera);
            const screenCenterX = (ndcCenter.x * 0.5 + 0.5) * screenWidth;
            const screenCenterY = (-ndcCenter.y * 0.5 + 0.5) * screenHeight;

            return {
                width: finalWidth,
                height: finalHeight,
                offsetX: minX - screenCenterX,  // Offset of top-left corner relative to center 左上角相对于中心的偏移
                offsetY: minY - screenCenterY
            };

        } catch (error) {
            console.warn('Bounding box calculation failed 包围盒计算失败:', error);
            return this._getFallbackBoundingBox();
        }
    }

    /**
     * Get fallback bounding box (used when calculation fails)
     * 获取备用包围盒（计算失败时使用）
     * 
     * @returns Default bounding box info 默认包围盒信息
     * 
     */
    _getFallbackBoundingBox(): { width: number; height: number; offsetX: number; offsetY: number } {
        return {
            width: 20,
            height: 20,
            offsetX: -10,
            offsetY: -10
        };
    }

    /**
     * Convert tile coordinates to local world coordinates
     * 将瓦片坐标转换为本地世界坐标
     * 
     * @param rawX - Raw X coordinate 原始X坐标
     * @param rawY - Raw Y coordinate 原始Y坐标
     * @param tileData - Tile data 瓦片数据
     * @param map - Map instance 地图实例
     * @returns Local world coordinate vector 本地世界坐标向量
     * @private
     */
    // @ts-ignore
    private _tileCoordToLocalWorld(
        rawX: number,
        rawY: number,
        tileData: any,
        map: Map
    ): Vector3 {
        const { tileZ, tileX, tileY, extent, tileSize } = tileData;
        const localX = (rawX / extent - 0.5) * tileSize;
        const localY = (0.5 - rawY / extent) * tileSize; // Y 轴反转
        const tileCenterWorldPos = map.tileIDToWorldCenter(tileZ, tileX, tileY);
        const featureLocalWorldPos = tileCenterWorldPos.clone().add(new Vector3(localX, localY, 0));
        return featureLocalWorldPos.sub(map.prjcenter as Vector3);
    }
}