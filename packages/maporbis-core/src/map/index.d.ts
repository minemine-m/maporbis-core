export * from "./utils";
import { Vector3, Vector2, Camera } from "three";
import { SceneRenderer, SceneRendererOptions, FlyToOptions, EaseToOptions } from "../renderer";
import { LngLatLike } from "../types";
import { Layer } from "../layer/Layer";
import { ITileLayer } from "../layer/TileLayer/interfaces/ITileLayer";
import { MapProjection as IProjection } from "../projection";
/**
 * Map source configuration options (tile layers and data levels).
 * 地图数据源配置选项（瓦片图层和数据级别）
 * @category Map
 */
export type MapSourceOptions = {
    /** Min data level 最小数据级别 */
    minLevel?: number;
    /** Max data level 最大数据级别 */
    maxLevel?: number;
    /** Base tile layers 底图瓦片图层 */
    baseLayers?: ITileLayer[];
};
/**
 * Camera configuration options.
 * 相机配置选项
 * @category Map
 */
export type CameraOptions = {
    /** Camera pitch angle in degrees (0 = looking straight down) 俯仰角（度，0为垂直向下看） */
    pitch?: number;
    /** Camera bearing angle in degrees (0 = north) 方位角（度，0为正北） */
    bearing?: number;
    /** Minimum camera distance 最小相机距离 */
    minDistance?: number;
    /** Maximum camera distance 最大相机距离 */
    maxDistance?: number;
};
/**
 * Interaction configuration options.
 * 交互配置选项
 * @category Map
 */
export type InteractionOptions = {
    /** Enable feature event handling 启用要素事件处理 */
    featureEvents?: boolean;
    /** Enable collision detection 启用碰撞检测 */
    collision?: boolean;
    /** Enable map dragging 启用地图拖拽 */
    draggable?: boolean;
    /** Enable scroll zoom 启用滚轮缩放 */
    scrollZoom?: boolean;
};
/**
 * Map state configuration options.
 * 地图状态配置选项
 * @category Map
 */
export type StateOptions = {
    /** Map center coordinates (Required) 地图中心点坐标（必填） */
    center: LngLatLike;
    /** Initial zoom level 初始缩放级别 */
    zoom?: number;
    /** Minimum allowed zoom level 最小缩放级别 */
    minZoom?: number;
    /** Maximum allowed zoom level 最大缩放级别 */
    maxZoom?: number;
};
/**
 * Map general configuration (using nested objects to distinguish modules).
 * 地图总配置类型（用嵌套对象区分模块）
 * @category Map
 */
export type MapOptions = {
    /**
     * Renderer configuration options.
     * 渲染器配置选项
     */
    renderer?: SceneRendererOptions;
    /**
     * Camera configuration options.
     * 相机配置选项
     */
    camera?: CameraOptions;
    /**
     * Interaction configuration options.
     * 交互配置选项
     */
    interaction?: InteractionOptions;
    /**
     * Source configuration options (tile layers and data levels).
     * 数据源配置选项（瓦片图层和数据级别）
     */
    source?: MapSourceOptions;
    /**
     * Map state configuration options.
     * 地图状态配置选项
     */
    state: StateOptions;
};
/**
 * Create an empty base class (only used as mixin starting point).
 * 创建一个空基类（仅用于混入起点）
 */
declare class EmptyClass {
    constructor(..._args: any[]);
}
declare const Map_base: {
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
        off: (type: string, listener: (
        /**
         * Interaction configuration options.
         * 交互配置选项
         * @category Map
         */
        ...args: any[]) => void) => import("..").EventClass;
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
    mergeOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any & typeof EmptyClass;
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & typeof EmptyClass;
    include(...sources: any[]): /*elided*/ any & typeof EmptyClass;
} & typeof EmptyClass;
/**
 * Map main class, inheriting from EventMixin and BaseMixin.
 * 地图主类，继承自事件混入和基础混入
 * @category Map
 * @example
 * const map = new Map('map-container', {
 *   state: {
 *     center: [120, 30],
 *     zoom: 12
 *   },
 *   source: {
 *     baseLayers: [...]
 *   }
 * });
 */
export declare class Map extends Map_base {
    /**
     * SceneRenderer instance.
     * 场景渲染器实例
     */
    sceneRenderer: SceneRenderer;
    /**
     * Map root object
     * 地图根对象
     */
    private _rootGroup;
    /**
     * Map layers
     * 地图图层
     */
    private _layers;
    /**
     * Map projection
     * 地图投影
     */
    private _mapProjection;
    /**
     * Update clock
     * 更新时钟
     */
    private readonly _animationClock;
    /**
     * Whether to automatically update
     * 是否自动更新
     */
    autoUpdate: boolean;
    /**
     * Update interval (ms)
     * 更新间隔（毫秒）
     */
    updateInterval: number;
    /**
     * Min zoom level
     * 最小缩放级别
     */
    minLevel: number;
    /**
     * Max zoom level
     * 最大缩放级别
     */
    maxLevel: number;
    /**
     * Get map projection.
     * 获取地图投影
     *
     * @returns Current map projection instance
     *          当前地图投影实例
     */
    getProjection(): IProjection;
    /**
     * Set map projection.
     * 设置地图投影
     *
     * @param projection New map projection instance
     *                   新的地图投影实例
     * @returns Map instance
     *          地图实例
     */
    setProjection(projection: IProjection): this;
    get projection(): IProjection;
    get lon0(): number;
    /**
     * Convert geographic coordinate to map model coordinate
     * 地理坐标转换到地图模型坐标
     * @param lngLat Geographic coordinate (Long, Lat, Alt)
     * @returns Map model coordinate
     */
    lngLatToPoint(lngLat: Vector3): Vector3;
    /**
     * Convert geographic coordinate to world coordinate
     * 地理坐标转换到世界坐标
     * @param lngLat Geographic coordinate (Long, Lat, Alt)
     * @returns World coordinate
     */
    lngLatToWorld(lngLat: Vector3): Vector3;
    /**
     * Convert map model coordinate to geographic coordinate
     * 地图模型坐标转换到地理坐标
     * @param point Map model coordinate
     * @returns Geographic coordinate (Long, Lat, Alt)
     */
    pointToLngLat(point: Vector3): Vector3;
    /**
     * Convert world coordinate to geographic coordinate
     * 世界坐标转换到地理坐标
     * @param worldPos World coordinate
     * @returns Geographic coordinate (Long, Lat, Alt)
     */
    worldToLngLat(worldPos: Vector3): Vector3;
    /**
     * Query intersection info at geographic coordinate
     * 查询指定地理坐标的交互/地面信息
     * @param lngLat Geographic coordinate
     * @returns Intersection info
     */
    queryAtLngLat(lngLat: Vector3): import("./utils").LocationInfo | undefined;
    /**
     * Query intersection info at world coordinate
     * 查询指定世界坐标的交互/地面信息
     * @param worldPos World coordinate
     * @returns Intersection info
     */
    queryAtWorld(worldPos: Vector3): import("./utils").LocationInfo | undefined;
    /**
     * Query intersection info at screen pixel coordinate
     * 查询指定屏幕坐标的交互/地面信息
     * @param point Screen pixel coordinate
     * @returns Intersection info
     */
    queryAtPoint(point: Vector2): import("./utils").LocationInfo | undefined;
    /**
     * Map center coordinates.

     * 地图中心点坐标
     */
    readonly center: LngLatLike;
    /**
     * Projected map center coordinates.
     * 投影后的地图中心点坐标
     */
    readonly prjcenter: Vector3;
    /**
     * Map configuration options.
     * 地图配置选项
     */
    options: MapOptions;
    /**
     * Event map table.
     * 事件映射表
     */
    private _eventState;
    /**
     * Canvas manager instance.
     * 画布管理器实例
     */
    private _canvasMgr;
    /**
     * Collision engine instance.
     * 碰撞引擎实例
     */
    private _collisionEngine;
    /**
     * Load hook function array.
     * 加载钩子函数数组
     */
    _onLoadHooks: Array<(...args: any[]) => void>;
    /**
     * Minimum/Maximum allowed zoom level for view (Configurable externally, only used for clipping logic).
     * 视图允许的最小/最大缩放级别（对外可配置，只用于裁剪逻辑）
     */
    private _minZoom;
    private _maxZoom;
    /**
     * Internal global zoom scale (Determines relation between zoom and distance, only for setZoom camera pushing).
     * 内部使用的全局 zoom 标尺（决定 zoom 与距离的关系，仅用于 setZoom 推相机）
     */
    private readonly _ZOOM_MIN_CONST;
    private readonly _ZOOM_MAX_CONST;
    /**
     * Nearest/Farthest allowed camera distance during zoom (Used for mapping).
     * 缩放时相机允许的最近/最远距离（用于映射）
     */
    private _minZoomDistance;
    private _maxZoomDistance;
    /**
     * Whether currently in zoom interaction.
     * 当前是否处于缩放交互中
     */
    private _isZooming;
    /**
     * Start zoom value of current zoom operation.
     * 本次缩放起始 zoom 值
     */
    private _zoomStartValue;
    /**
     * Last recorded zoom (Used for control events).
     * 上一次记录的 zoom（用于控制器事件）
     */
    private _lastZoomForControls;
    /**
     * "Extra zoom levels" beyond data levels (Overzoom count).
     * 超出数据层级后的“额外 zoom 级数”（overzoom 计数）
     */
    private _overZoom;
    /**
     * Record camera distance to target in previous frame, used to determine zoom in/out direction.
     * 记录上一帧相机到目标点的距离，用于判断放大/缩小方向
     */
    private _lastCameraDistance;
    /**
     * Model features collection for animation updates (Pro feature placeholder).
     * 模型要素集合，用于动画更新（Pro 功能占位）
     */
    private _modelFeatures;
    /**
     * Create map instance.
     * 创建地图实例
     *
     * @param domContainer Map container element or element ID
     *                  地图容器元素或元素ID
     * @param config Map configuration options
     *                地图配置选项
     */
    constructor(container: HTMLElement | string, options: MapOptions);
    /**
     * Add hook function after load completion.
     * 添加加载完成后的钩子函数
     *
     * @param fn Function name or function
     *           函数名或函数
     * @param args Additional arguments
     *             附加参数
     * @returns Map class
     *          地图类
     */
    static addOnLoadHook(fn: string | ((this: Map, ...args: any[]) => void), ...args: any[]): typeof Map;
    /**
     * Internal method: Call all load hook functions.
     * 内部方法:调用所有加载钩子函数
     */
    _callOnLoadHooks(): void;
    /**
     * Get current "View Zoom Level".
     * 获取当前“视图缩放级别”
     *
     * @description
     * Mapped to fixed scale [0, 22] based on camera distance.
     * This value can exceed data source maxLevel (e.g., 18), used for UI / Styling / Interaction.
     * 按相机距离映射到固定标尺 [0, 22]。
     * 这个值可以超过数据源的 maxLevel（比如 18），用于 UI / 样式 / 交互。
     */
    getZoom(): number;
    /**
    * Get current "Data Zoom Level" (Tile z).
    * 获取当前“数据缩放级别”（瓦片 z）
    *
    * @description
    * Actual z calculated from TileMap base layer tile tree.
    * Max value limited by data source and TileLayer.maxLevel, e.g., data only goes up to 18.
    * 从 TileMap 的底图瓦片树中统计出来的实际 z。
    * 最大值受数据源和 TileLayer.maxLevel 限制，例如数据只到 18。
     */
    getTileZoom(): number;
    /**
     * Get view minimum zoom level.
     * 获取视图最小缩放级别
     */
    getMinZoom(): number;
    /**
     * Get view maximum zoom level.
     * 获取视图最大缩放级别
     */
    getMaxZoom(): number;
    /**
    * Set view zoom range.
    * 设置视图缩放范围
    *
    * @param minZoom Minimum zoom level
    *                最小缩放级别
    * @param maxZoom Maximum zoom level
    *                最大缩放级别
    */
    setZoomBounds(minZoom: number, maxZoom: number): this;
    /**
     * Set minimum zoom level.
     * 设置最小缩放级别
     */
    setMinZoom(minZoom: number): this;
    /**
     * Set maximum zoom level.
     * 设置最大缩放级别
     */
    setMaxZoom(maxZoom: number): this;
    /**
     * Set zoom level.
     * 设置缩放级别
     *
     * @param zoom Target zoom level
     *             目标缩放级别
     * @returns Map instance
     *          地图实例
     */
    setZoom(zoom: number): this;
    /**
     * Zoom in by specified levels.
     * 放大指定级数
     *
     * @param delta Zoom in levels, default 1
     *              放大级数，默认 1
     */
    zoomIn(delta?: number): this;
    /**
     * Zoom out by specified levels.
     * 缩小指定级数
     *
     * @param delta Zoom out levels, default 1
     *              缩小级数，默认 1
     */
    zoomOut(delta?: number): this;
    /**
     * Get current camera pitch angle in degrees.
     * 获取当前相机俯仰角（度）
     *
     * @returns Pitch angle in degrees (0 = looking straight down, 90 = horizontal)
     *          俯仰角（度，0为垂直向下看，90为水平）
     */
    getPitch(): number;
    /**
     * Set camera pitch angle in degrees.
     * 设置相机俯仰角（度）
     *
     * @param pitch Pitch angle in degrees (0 = looking straight down, 90 = horizontal)
     *              俯仰角（度，0为垂直向下看，90为水平）
     * @returns Map instance
     *          地图实例
     */
    setPitch(pitch: number): this;
    /**
     * Get current camera bearing angle in degrees.
     * 获取当前相机方位角（度）
     *
     * @returns Bearing angle in degrees (0 = north, 90 = east)
     *          方位角（度，0为正北，90为正东）
     */
    getBearing(): number;
    /**
     * Set camera bearing angle in degrees.
     * 设置相机方位角（度）
     *
     * @param bearing Bearing angle in degrees (0 = north, 90 = east)
     *                方位角（度，0为正北，90为正东）
     * @returns Map instance
     *          地图实例
     */
    setBearing(bearing: number): this;
    /**
     * Get minimum camera distance.
     * 获取最小相机距离
     *
     * @returns Minimum camera distance
     *          最小相机距离
     */
    getMinDistance(): number;
    /**
     * Set minimum camera distance.
     * 设置最小相机距离
     *
     * @param minDistance Minimum camera distance
     *                    最小相机距离
     * @returns Map instance
     *          地图实例
     */
    setMinDistance(minDistance: number): this;
    /**
     * Get maximum camera distance.
     * 获取最大相机距离
     *
     * @returns Maximum camera distance
     *          最大相机距离
     */
    getMaxDistance(): number;
    /**
     * Set maximum camera distance.
     * 设置最大相机距离
     *
     * @param maxDistance Maximum camera distance
     *                    最大相机距离
     * @returns Map instance
     *          地图实例
     */
    setMaxDistance(maxDistance: number): this;
    /**
     * Inverse calculate camera distance to target from view zoom level.
     * 根据视图缩放级别反推相机到目标点的距离
     */
    private _computeDistanceFromZoom;
    /**
     * Initialize map.
     * 初始化地图
     */
    private initMap;
    /**
     * Update default ground plane visibility based on tile layers.
     * 根据瓦片图层更新默认地面可见性
     *
     * @description
     * Shows the default ground plane when no tile layers are present,
     * hides it when at least one tile layer exists.
     * 当没有瓦片图层时显示默认地面，当存在至少一个瓦片图层时隐藏。
     *
     * @internal
     */
    private _updateDefaultGroundVisibility;
    /**
     * Show or hide the default ground plane manually.
     * 手动显示或隐藏默认地面
     *
     * @param visible - Whether to show the ground plane. 是否显示地面
     * @returns Current map instance. 当前地图实例
     */
    setGroundVisible(visible: boolean): this;
    /**
     * Check if the default ground plane is visible.
     * 检查默认地面是否可见
     *
     * @returns Whether the ground is visible. 地面是否可见
     */
    isGroundVisible(): boolean;
    /**
     * Update map and layers.
     * 更新地图和图层
     */
    render(camera: Camera): void;
    /**
     * Update all registered model animations.
     * 更新所有已注册的模型动画
     *
     * @param deltaTime Delta time in seconds
     *                  增量时间（秒）
     * @private
     */
    private _updateModelAnimations;
    /**
     * Add layer(s) to the map.
     * 添加图层到地图
     *
     * @param layerOrLayers Layer object or array of layer objects
     *               图层对象或图层对象数组
     * @param otherLayers Other layer objects
     *                    其他图层对象
     * @returns Current map instance
     *          当前地图实例
     */
    addLayer(layerOrLayers: Layer | Array<Layer>, ...otherLayers: Array<Layer>): this;
    /**
    * Remove layer.
    * 移除图层
    */
    removeLayer(id: string): boolean;
    /**
     * Add regular layer (Add to scene only).
     * 添加普通图层（只添加到场景）
     */
    private addRegularLayer;
    /**
    * Add tile layer.
    * 添加瓦片图层
    */
    addTileLayer(layer: ITileLayer): this;
    /**
     * Clear all layers.
     * 清空所有图层
     *
     * @returns Layer container instance
     *          图层容器实例
     */
    clearLayers(): this;
    /**
     * Get all layers.
     * 获取所有图层
     *
     * @returns Array of layers
     *          图层数组
     */
    getLayers(): any[];
    /**
     * Get layer by ID.
     * 根据ID获取图层
     *
     * @param id Layer ID
     *           图层ID
     * @returns Layer instance or undefined
     *          图层实例或undefined
     */
    getLayer(id: string): any;
    /**
     * Get canvas.
     * 获取画布
     *
     * @param width Canvas width
     *              画布宽度
     * @param height Canvas height
     *               画布高度
     * @param keySuffix Key suffix
     *                  键名后缀
     * @returns Canvas instance
     *          画布实例
     */
    _getCanvas(width?: number, height?: number, keySuffix?: string): HTMLCanvasElement;
    /**
     * Get map container.
     * 获取地图容器
     *
     * @returns Map container instance
     *          地图容器实例
     */
    getContainer(): HTMLElement | undefined;
    /**
     * Get renderer.
     * 获取渲染器
     *
     * @returns Renderer instance
     *          渲染器实例
     */
    getRenderer(): import("three").WebGLRenderer | import("three/webgpu").WebGPURenderer;
    /**
     * Get camera.
     * 获取相机
     *
     * @returns Camera instance
     *          相机实例
     */
    getCamera(): import("three").PerspectiveCamera;
    /**
     * Find all Features at a specific position.
     * 找出某位置的所有Feature
     */
    _queryFeaturesAt(position: {
        x: number;
        y: number;
    }): any[];
    /**
     * Get current map center point (Longitude, Latitude).
     * 获取当前地图中心点（经纬度）
     *
     * @returns Coordinate [lng, lat, height]
     */
    getCenter(): LngLatLike;
    /**
     * Get event position (Screen coordinates).
     * 获取事件位置（屏幕坐标）
     */
    _getPointerPosition(domEvent: MouseEvent | TouchEvent): {
        x: number;
        y: number;
    } | null;
    get isInteracting(): boolean;
    /**
     * Internal tool: Get distance from current camera to target point.
     * 内部工具：获取当前相机到目标点的距离
     */
    private _getCameraDistance;
    /**
     * Internal tool: Calculate theoretically reachable zoom range of view based on current control distance limits.
     * 内部工具：根据当前控制器的距离限制，推算视图理论可达的 zoom 区间
     *
     * @returns {Object} `{ min: number, max: number }`
     */
    private _getViewZoomRange;
    /**
     * Fly to specified position.
     * 飞行到指定位置
     *
     * @param flyConfig Flight parameters object. Can specify either:
     *                  1. center + cameraCoord: Directly specify target and camera positions
     *                  2. center + distance/pitch/bearing: Specify target and viewing angle
     *                飞行参数对象。可以指定：
     *                  1. center + cameraCoord：直接指定目标点和相机位置
     *                  2. center + distance/pitch/bearing：指定目标点和视角参数
     */
    flyTo(flyConfig: FlyToOptions): void;
    /**
     * Fly to point position.
     * 飞行到指定点的位置
     *
     * @param flyConfig Flight parameters object
     *                飞行参数对象
     */
    easeTo(flyConfig: EaseToOptions): void;
    /**
     * Destroy map instance, release all resources.
     * 销毁地图实例，释放所有资源
     *
     * @description
     * This method cleans up the following resources:
     * 1. Remove all event listeners
     * 2. Clear all layers
     * 3. Destroy collision engine
     * 4. Destroy sceneRenderer (including renderer, scene, controls, etc.)
     * 5. Clean up DOM container
     *
     * 该方法会清理以下资源：
     * 1. 移除所有事件监听器
     * 2. 清空所有图层
     * 3. 销毁碰撞引擎
     * 4. 销毁sceneRenderer（包括renderer、scene、controls等）
     * 5. 清理DOM容器
     */
    dispose(): void;
}
