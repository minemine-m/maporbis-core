import { Point as GeoJSONPoint, MultiPoint as GeoJSONMultiPoint, LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString, Polygon as GeoJSONPolygon, MultiPolygon as GeoJSONMultiPolygon } from 'geojson';
import { Line2 } from 'three-stdlib';
import { Object3D, Vector3, Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OverlayLayer } from '../layer/OverlayLayer';
import { Layer } from '../layer/Layer';
import { Paint, PaintInput } from '../style/index';
import { ICollidable } from '../core/collision/interfaces/ICollidable';
import { CollisionType, CollisionReason, IBoundingBox } from '../core/collision/types/CollisionTypes';
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
    userData?: {
        [key: string]: any;
    };
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
};
/**
 * Union type for GeoJSON geometry types.
 * GeoJSON几何类型联合类型
  * @category Feature
 */
export type GeoJSONGeometry = GeoJSONPoint | GeoJSONMultiPoint | GeoJSONLineString | GeoJSONMultiLineString | GeoJSONPolygon | GeoJSONMultiPolygon;
declare const Feature_base: {
    new (...args: any[]): {
        [key: string]: any;
        _handlers?: import("../handler/Handler").default[];
        addHandler(name: string | number, handlerClass: new (arg0: /*elided*/ any) => any): /*elided*/ any;
        removeHandler(name: string | number): /*elided*/ any;
        _clearHandlers(): void;
    };
} & {
    new (...args: any[]): {
        eventClass: import("..").EventClass;
        on: (type: string, listener: (data?: any) => void) => import("..").EventClass;
        fire: (type: string, data?: any) => import("..").EventClass;
        off: (type: string, listener: (... /**
         * Whether the feature is editable (default: false).
         * 是否可编辑（默认false）
         */args: any[]) => void) => import("..").EventClass;
    };
} & {
    new (...args: any[]): {
        [x: string]: any;
        options: any;
        _isUpdatingOptions?: boolean;
        _initHooksCalled?: boolean;
        _initHooks?: Function[];
        _proxyOptions(): /*elided*/ any;
        _callInitHooks(): /*elided*/ any;
        setOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any;
        configure(conf?: string | import("../core/mixins").ClassOptions, value?: any): import("../core/mixins").ClassOptions | /*elided*/ any;
        onOptionsChange(_conf: import("../core/mixins").ClassOptions): void;
        _visitInitHooks(proto: {
            _initHooks: any;
        }): void;
    };
    mergeOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any & typeof Object3D;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & typeof Object3D;
    include(...sources: any[]): /*elided*/ any & typeof Object3D;
} & typeof Object3D;
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
export declare abstract class Feature extends Feature_base implements ICollidable {
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
    private _paintManager;
    /**
     * Internal bloom helper.
     * 内部发光效果辅助器
     */
    /**
     * Whether geometry is currently initializing.
     * 是否正在初始化几何体
     */
    private _isGeometryInitializing;
    /**
     * Internal collision configuration.
     * 内部碰撞配置
     */
    private _collisionConfig;
    /**
     * Collision state.
     * 碰撞状态
     */
    private _collisionState;
    /**
     * Animation reference ID.
     */
    private _animationRef;
    /**
     * Create a feature instance.
     * 创建要素实例
     *
     * @param options - Feature configuration options. 要素配置选项
     * @throws Throws error if geometry is not provided. 如果未提供geometry参数会抛出错误
     */
    constructor(options: FeatureOptions);
    /**
     * Ensure render object is added to the scene.
     * 确保渲染对象已添加到场景中
     */
    private _ensureRenderObjectInScene;
    /**
     * Apply alpha value to object.
     * 应用透明度值到对象
     * @internal Reserved for collision visibility animation
     */
    private _applyAlphaToObject;
    /**
     * Called when paint is successfully applied.
     * 样式成功应用后调用
     */
    private _onPaintApplied;
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
    initializeGeometry(): Promise<void>;
    /**
     * 构建渲染对象 (Internal)
     * Build the Three.js object for rendering.
     */
    abstract _buildRenderObject(): Promise<void> | void;
    /**
     * 更新渲染对象的坐标 (Internal)
     * Update the coordinates of the render object.
     */
    protected _refreshCoordinates(): void;
    /**
     * Set paint.
     * 设置样式
     *
     * @param input - Paint configuration or paint instance. 样式配置或样式实例
     * @returns Current feature instance (supports method chaining). 当前要素实例（支持链式调用）
     */
    setPaint(input: PaintInput): this;
    /**
     * Get current paint.
     * 获取当前样式
     *
     * @returns Current paint or undefined. 当前样式或undefined
     */
    getPaint(): Paint | undefined;
    /**
     * Paint property getter/setter for convenience.
     */
    get paint(): Paint | undefined;
    set paint(value: PaintInput | undefined);
    /**
     * Set bloom status for the current feature.
     * 设置当前要素的发光状态
     *
     * @param enabled Whether to enable bloom. 是否启用发光
     * @param options Optional: bloom intensity and color. 可选：发光强度和颜色
     */
    setBloom(enabled: boolean, options?: {
        intensity?: number;
        color?: string;
    }): this;
    /**
     * Get bloom configuration of the current feature.
     * 获取当前要素的发光配置
     */
    getBloom(): {
        enabled: boolean;
        intensity: number;
        color: string;
    } | undefined;
    /**
     * Add feature to layer
     * 将要素添加到图层
     *
     * @param layer - Target layer 目标图层
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    addTo<T extends Feature>(layer: OverlayLayer<T>): this;
    /**
     * Get parent layer
     * 获取所属图层
     *
     * @returns Layer instance or null 图层实例或null
     */
    getLayer(): Layer | null;
    /**
     * Get parent map
     * 获取所属地图
     *
     * @returns Map instance or null 地图实例或null
     */
    getMap(): Map | null;
    /**
     * Set feature coordinates (geographic coordinates)
     * 设置要素坐标（地理坐标）
     *
     * @param coordinates - Longitude and latitude coordinates 经纬度坐标
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    setCoordinates(coordinates: any): this;
    /**
     * Internal processing after coordinate change
     * 坐标变化后的内部处理
     *
     * @param fastUpdate - Whether to use fast update mode (only updates vertex positions, does not rebuild geometry) 是否使用快速更新模式（仅更新顶点位置，不重建几何体）
     */
    protected _applyCoordinateChanges(fastUpdate?: boolean): void;
    /**
     * Get feature center (geographic coordinates)
     * 获取要素中心点（地理坐标）
     *
     * @returns Center coordinates [lng, lat] 中心点坐标 [经度, 纬度]
     */
    getCenter(): [number, number];
    /**
     * Bind to layer (internal use)
     * 绑定到图层（内部使用）
     *
     * @param layer - Layer instance 图层实例
     * @throws Throws error if feature already belongs to another layer 如果要素已属于其他图层会抛出错误
     */
    _bindLayer(layer: Layer): void;
    /**
     * Update geometry
     * 更新几何体
     */
    _updateGeometry(): void;
    /**
     * Try to process paint queue. (Internal)
     * 尝试处理样式队列
     */
    protected _tryProcessQueue(): void;
    /**
     * Remove self from layer
     * 从图层中移除自身
     *
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    _remove(): this;
    /**
     * Unbind from layer (internal use)
     * 解除图层绑定（内部使用）
     */
    _unbind(): void;
    /**
     * Dispose geometry resources
     * 释放几何体资源
     */
    _disposeGeometry(): void;
    /**
     * Get whether collision detection is enabled
     * 获取是否启用碰撞检测
     *
     * @returns Whether collision detection is enabled 是否启用碰撞检测
     */
    get collidable(): boolean;
    /**
     * Get collision type (subclasses need to override)
     * 获取碰撞类型（子类需要重写）
     *
     * @returns Collision type 碰撞类型
     */
    get collisionType(): CollisionType;
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
    getCollisionPriority(): number;
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
    getScreenBoundingBox(camera: Camera, renderer: WebGLRenderer | WebGPURenderer): IBoundingBox | null;
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
    setCollisionVisibility(visible: boolean, reason?: CollisionReason): void;
    /**
     * Get current collision visibility
     * 获取当前碰撞可见性
     *
     * @returns Current visibility state 当前可见性状态
     */
    getCollisionVisibility(): boolean;
    /**
     * Set collision detection configuration
     * 设置碰撞检测配置
     *
     * @param config - Collision configuration options 碰撞配置选项
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    setCollisionConfig(config: Partial<typeof this._collisionConfig>): this;
    /**
     * Enable collision detection
     * 启用碰撞检测
     *
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    enableCollision(): this;
    /**
     * Disable collision detection
     * 禁用碰撞检测
     *
     * @returns Current feature instance (supports method chaining) 当前要素实例（支持链式调用）
     */
    disableCollision(): this;
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
    private _applyVisibilityAlpha;
    /**
     * Apply final alpha and force update
     * 应用最终透明度并强制更新
     *
     * @param alpha - Alpha value (0-1) 透明度值（0-1）
     * @private
     */
    private _applyFinalAlpha;
    /**
     * Get collision related data
     * 获取碰撞相关数据
     *
     * @returns Object containing feature type, user data, and style config 包含要素类型、用户数据、样式配置的对象
     */
    getCollisionData(): any;
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
    _calculateCollisionBoundingBox(camera?: Camera, renderer?: WebGLRenderer | WebGPURenderer): {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    } | null;
    /**
     * Get fallback bounding box (used when calculation fails)
     * 获取备用包围盒（计算失败时使用）
     *
     * @returns Default bounding box info 默认包围盒信息
     *
     */
    _getFallbackBoundingBox(): {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    };
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
    private _tileCoordToLocalWorld;
}
export {};
