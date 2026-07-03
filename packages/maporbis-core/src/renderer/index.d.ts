/**
 * @module SceneRenderer
 */
import { AmbientLight, BaseEvent, DirectionalLight, EventDispatcher, Object3DEventMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { WebGPURenderer } from "three/webgpu";
import { MapControls } from "three-stdlib";
import { Clouds } from "@pmndrs/vanilla";
import type { Map } from "../map";
import { LngLatLike } from "../types";
/**
 * SceneRenderer event mapping interface
 * SceneRenderer事件映射接口
 * @extends Object3DEventMap
 * @category SceneRenderer
 */
export interface SceneRendererEventMap extends Object3DEventMap {
    /** Update event, including time delta 更新事件，包含时间增量 */
    update: BaseEvent & {
        delta: number;
    };
}
/**
 * SceneRenderer configuration options
 * SceneRenderer配置选项
 * @category SceneRenderer
 */
export type SceneRendererOptions = {
    /** Whether to enable antialiasing, default is false 是否启用抗锯齿，默认为false */
    antialias?: boolean;
    /** Whether to use stencil buffer, default is true 是否使用模板缓冲区，默认为true */
    stencil?: boolean;
    /** Whether to use logarithmic depth buffer, default is true 是否使用对数深度缓冲区，默认为true */
    logarithmicDepthBuffer?: boolean;
    /** Whether panning is draggable, default is true 是否可拖拽平移，默认为 true */
    draggable?: boolean;
    /** Skybox configuration 天空盒配置 */
    skybox?: {
        /** Skybox image path 天空盒图片路径 */
        path?: string;
        /** HDR file path HDR文件路径 */
        hdr?: string;
        /**
         * Skybox image filenames array, order: [px, nx, py, ny, pz, nz]
         * 天空盒图片文件名数组，顺序为：[右,左,上,下,前,后]
         */
        files?: string[];
        /** Default skybox color (used when loading fails) 天空盒默认颜色（当加载失败时使用） */
        defaultColor?: number;
        /** Whether HDR is equirectangular, true for equirectangular, false for cubemap HDR是否为等距柱状投影，true为等距柱状，false为立方体贴图 */
        hdrEquirectangular?: boolean;
        /** HDR exposure value HDR曝光值 */
        hdrExposure?: number;
        /** HDR encoding HDR编码方式 */
        hdrEncoding?: number;
    };
    /** Whether to enable debug mode 是否启用调试模式 */
    debug?: boolean;
    /** Whether to use WebGPU renderer (experimental) 是否使用WebGPU渲染器（实验性） */
    useWebGPU?: boolean;
    /** Map instance 地图实例 */
    map?: Map;
    /**
     * Camera bearing angle (in degrees)
     * 相机方位角（角度制）
     * 0 = looking North, 90 = looking East, 180 = looking South, 270 = looking West
     * 0 = 朝北，90 = 朝东，180 = 朝南，270 = 朝西
     */
    bearing?: number;
    /**
     * Camera pitch angle (in degrees)
     * 相机俯仰角（角度制）
     * 0 = top-down view, 90 = horizontal (no artificial limit)
     * 0 = 正上方俯视，90 = 水平（无人为限制）
     */
    pitch?: number;
    /** Bloom post-processing configuration (optional) Bloom 后处理配置（可选） */
    bloom?: {
        enabled?: boolean;
        /** Bloom strength, corresponds to UnrealBloomPass strength 辉光强度，对应 UnrealBloomPass 的 strength */
        strength?: number;
        /** Bloom radius, corresponds to UnrealBloomPass radius 辉光扩散半径，对应 UnrealBloomPass 的 radius */
        radius?: number;
        /** Bloom threshold, corresponds to UnrealBloomPass threshold 触发辉光的亮度阈值，对应 UnrealBloomPass 的 threshold */
        threshold?: number;
    };
    /** Minimum controller zoom distance (how close the camera can get), default is 100 控制器最小缩放距离（相机能靠多近），默认为 100 */
    minDistance?: number;
    /** Maximum controller zoom distance (how far the camera can move), default is 60000 控制器最大缩放距离（相机能拉多远），默认为 60000 */
    maxDistance?: number;
    /** Default ground configuration 默认地面配置 */
    defaultGround?: {
        /** Whether to enable default ground, default is false 是否启用默认地面，默认为 false */
        enabled?: boolean;
        /** Whether default ground is visible, default is false 默认地面是否可见，默认为 false */
        visible?: boolean;
        /** Ground color, default is "rgb(45,52,60)" 地面颜色，默认为 "rgb(45,52,60)" */
        color?: string | number;
        /** Ground opacity, default is 1 地面透明度，默认为 1 */
        opacity?: number;
    };
};
/**
 * flyTo method parameters interface
 * flyTo方法参数接口
 * @category SceneRenderer
 */
export interface FlyToOptions {
    /** Longitude and latitude 经纬度 */
    center: LngLatLike;
    /** Camera coordinates 相机 */
    cameraCoord?: LngLatLike;
    /**
     * Distance from camera to target point (consistent with OrbitControls.getDistance)
     * 相机到目标点的距离（与 OrbitControls.getDistance 一致）
     * Unit consistent with world coordinates.
     * 单位与世界坐标一致。
     */
    distance?: number;
    /**
     * Camera pitch angle (in degrees)
     * 相机俯仰角（角度制）
     * 0 = top-down view, 90 = horizontal
     * 0 = 正上方俯视，90 = 水平
     */
    pitch?: number;
    /**
     * Camera bearing angle (in degrees)
     * 相机方位角（角度制）
     * 0 = looking North, 90 = looking East
     * 0 = 朝北，90 = 朝东
     */
    bearing?: number;
    duration?: number;
    delay?: number;
    complete?: () => void;
    /** Whether to use curved path (default is straight line) 是否使用曲线路径飞行（默认直线） */
    curvePath?: boolean;
}
export interface EaseToOptions {
    center: LngLatLike;
    duration?: number;
    /**
     * Distance from camera to target point (consistent with OrbitControls.getDistance)
     * 相机到目标点的距离（与 OrbitControls.getDistance 一致）
     * Unit consistent with world coordinates. Recommended to use this field.
     * 单位与世界坐标一致。建议优先使用该字段。
     */
    distance?: number;
    /**
     * @deprecated Recommended to use distance.
     * @deprecated 建议使用 distance。
     * Same semantics as distance: distance from camera to target point.
     * 语义与 distance 相同：相机到目标点的距离。
     * Kept for backward compatibility.
     * 保留只是为了向后兼容旧代码。
     */
    altitude?: number;
    /**
     * Camera pitch angle (in degrees)
     * 相机俯仰角（角度制）
     * 0 = top-down view, 90 = horizontal (no artificial limit)
     * 0 = 正上方俯视，90 = 水平（无人为限制）
     */
    pitch?: number;
    /**
     * Camera bearing angle (in degrees)
     * 相机方位角（角度制）
     * 0 = looking North, 90 = looking East
     * 0 = 朝北，90 = 朝东
     */
    bearing?: number;
    complete?: () => void;
    curvePath?: boolean;
}
declare const SceneRendererBase: {
    new (...args: any[]): {
        eventClass: import("..").EventClass;
        on: (type: string, listener: (data?: any) => void) => import("..").EventClass;
        fire: (type: string, data?: any) => import("..").EventClass;
        off: (type: string, listener: (...args: any[]) => void) => import("..").EventClass;
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
    mergeOptions(options: import("../core/mixins").ClassOptions): /*elided*/ any & {
        new (): EventDispatcher<SceneRendererEventMap>;
    };
    addInitHook(fn: Function | string, ...args: any[]): /*elided*/ any & {
        new (): EventDispatcher<SceneRendererEventMap>;
    };
    include(...sources: any[]): /*elided*/ any & {
        new (): EventDispatcher<SceneRendererEventMap>;
    };
} & {
    new (): EventDispatcher<SceneRendererEventMap>;
};
/**
 * Three.js scene initialization class
 * Three.js场景初始化类
 * @extends EventDispatcher<SceneRendererEventMap>
 * @category SceneRenderer
 */
export declare class SceneRenderer extends SceneRendererBase {
    /** Scene object 场景对象 */
    readonly scene: Scene;
    /** WebGL renderer WebGL渲染器 */
    readonly renderer: WebGLRenderer | WebGPURenderer;
    /** Perspective camera 透视相机 */
    readonly camera: PerspectiveCamera;
    /** Map controls 地图控制器 */
    readonly controls: MapControls;
    /** Ambient light 环境光 */
    readonly ambLight: AmbientLight;
    /** Directional light 平行光 */
    readonly dirLight: DirectionalLight;
    /** 辅助平行光 (补光) */
    /** 云层效果 */
    clouds: Clouds | null;
    /** 容器元素 */
    container?: HTMLElement;
    /** 内部时钟 */
    private readonly _clock;
    /** 性能统计器 */
    private stats;
    /** 动画回调集合 */
    private _animationCallbacks;
    /** 雾效因子 */
    private _fogFactor;
    private _sceneSize;
    /** 地面网格 */
    private _defaultGround;
    /** 地图实例 */
    map: Map;
    centerWorldPos: Vector3;
    private _isInteracting;
    /** 是否启用调试模式 */
    private debug;
    private flyTween;
    /** 渲染器是否已准备就绪 (WebGPU需要异步初始化) */
    private _isRendererReady;
    /** 后期处理：bloom 管线 */
    private composer?;
    private renderPass?;
    private bloomPass?;
    /**
     * 获取雾效因子
     */
    get fogFactor(): number;
    get isInteracting(): boolean;
    /**
     * 设置雾效因子（默认1）
     */
    set fogFactor(value: number);
    /**
     * 获取容器宽度
     */
    get width(): number;
    /**
     * 获取容器高度
     */
    get height(): number;
    /**
     * 构造函数
     * @param container 容器元素或选择器字符串
     * @param options 配置选项
     */
    constructor(container?: HTMLElement | string, options?: SceneRendererOptions);
    /**
     * Add renderer to container
     * 将渲染器添加到容器
     * @param container Container element or selector string 容器元素或选择器字符串
     * @returns this
     */
    addTo(container: HTMLElement | string): this;
    /**
     * Create scene
     * 创建场景
     * @param skyboxConfig Skybox configuration 天空盒配置
     * @returns Scene object 场景对象
     */
    private _createScene;
    /**
     * 使用PMREM加载HDR环境贴图
     * @param scene 场景对象
     * @param skyboxConfig 天空盒配置
     */
    private _loadHDRWithPMREM;
    /**
     * 创建WebGL渲染器
     * @param antialias 是否抗锯齿
     * @param stencil 是否使用模板缓冲区
     * @param logarithmicDepthBuffer 是否使用对数深度缓冲区
     * @param useWebGPU 是否使用WebGPU
     * @returns 渲染器对象
     */
    private _createRenderer;
    /**
     * Create camera
     * 创建相机
     * @returns Camera object 相机对象
     */
    private _createCamera;
    /**
     * Create map controls
     * 创建地图控制器
     * @param minDistance Minimum zoom distance 最小缩放距离
     * @param maxDistance Maximum zoom distance 最大缩放距离
     * @returns Controls object 控制器对象
     */
    private _createControls;
    /**
     * Create ambient light
     * 创建环境光
     * @returns Ambient light object 环境光对象
     */
    private _createAmbLight;
    /**
     * 创建平行光
     * @returns 平行光对象
     */
    private _createDirLight;
    /**
     * 创建三个辅助平行光 (后补光、左侧光、右侧光)，指向场景中心。
     * @returns 返回后补光实例 (匹配 this.auxDirLight 属性)
     * @internal Reserved for future use
     */
    private _createAuxDirLight;
    /**
     * Create a single auxiliary directional light instance.
     * 创建单个辅助平行光实例。
     * @param x Light source world X coordinate 光源的世界X坐标
     * @param y Light source world Y coordinate 光源的世界Y坐标
     * @param z Light source world Z coordinate 光源的世界Z坐标
     * @param intensity Light intensity 光源强度
     * @returns DirectionalLight
     */
    private _createAuxLightInstance;
    /**
     * Resize container
     * 调整容器大小
     * @returns this
     */
    resize(): this;
    /**
     * 添加动画回调
     * @param callback 回调函数，接收deltaTime和elapsedTime参数
     * @returns 移除回调的函数
     */
    addAnimationCallback(callback: (delta: number, elapsedtime: number, context: SceneRenderer) => void): () => void;
    /**
     * 动画循环
     */
    private animate;
    /**
     * Fly to specified position
     * 飞行到指定位置
     * @param centerWorldPos Map center target position (world coordinates) 地图中心目标位置（世界坐标）
     * @param cameraWorldPos Camera target position (world coordinates) 相机目标位置（世界坐标）
     * @param animate Whether to enable animation 是否启用动画
     * @param onComplete Completion callback 完成回调
     */
    flyTo(centerWorldPos: Vector3, cameraWorldPos: Vector3, animate?: boolean, onComplete?: (obj: Vector3) => void): void;
    /**
     * Advanced fly to specified position method
     * 高级飞行到指定位置的方法
     *
     * Supports both straight and curved flight paths, allowing customization of flight duration, delay, and completion callback.
     * Achieves smooth camera movement and view transition via Tween animation.
     * 支持直线和曲线两种飞行路径，可以自定义飞行持续时间、延迟和完成回调。
     * 通过Tween动画实现平滑的相机移动和视角过渡。
     *
     * @param options - Flight configuration options 飞行配置选项
     * @param options.center - Target center point longitude and latitude coordinates 目标中心点的经纬度坐标
     * @param options.cameraCoord - Camera target position longitude and latitude coordinates 相机目标位置的经纬度坐标
     * @param options.duration - Flight animation duration (ms), default 2000ms 飞行动画持续时间（毫秒），默认2000ms
     * @param options.delay - Delay before flight starts (ms), default 0ms 开始飞行前的延迟时间（毫秒），默认0ms
     * @param options.complete - Callback function when flight completes 飞行完成时的回调函数
     * @param options.curvePath - Whether to use curved flight path, true for cubic Bezier curve, false for straight line (default) 是否使用曲线路径飞行，true为三次贝塞尔曲线，false为直线（默认）
     *
     *
     * @remarks
     * - If there is an ongoing flight animation, it will be stopped automatically
     * - Camera position, view, and target point will be updated during flight
     * - Curved path uses cubic Bezier curve, control points are automatically generated
     * - Longitude and latitude coordinates will be automatically converted to world coordinates
     * - 如果之前有正在进行的飞行动画，会自动停止
     * - 飞行过程中会更新相机位置、视角和目标点
     * - 曲线路径使用三次贝塞尔曲线，控制点自动生成
     * - 经纬度坐标会自动转换为世界坐标
     *
     * @throws Returns silently when center or cameraCoord parameters are invalid, no exception thrown 当center或cameraCoord参数无效时静默返回，不抛出异常
     */
    flyToAdvanced(options: FlyToOptions): void;
    /**
     * Options change callback.
     * 配置更新回调
     * Triggered when sceneRenderer.configure() is called to update options.
     * 当调用 sceneRenderer.configure() 更新配置时，会触发此方法
     */
    onOptionsChange(conf: SceneRendererOptions): void;
    /**
     * 飞行到指定点，自动计算相机位置
     * @param center 目标点的经纬度坐标
     * @param options 飞行选项
     */
    easeTo(options: EaseToOptions): void;
    /**
     * Calculate camera position in world coordinates.
     * 计算相机在世界坐标系中的位置
     * @param target Target point (world coordinates) 目标点（世界坐标）
     * @param distance Distance from camera to target 相机到目标的距离
     * @param pitchRad Pitch angle in radians (0=top-down, Math.PI/2=horizontal) 俯仰角（弧度）
     * @param bearingRad Bearing angle in radians 方位角（弧度）
     * @returns Camera position (world coordinates) 相机位置（世界坐标）
     */
    calculateCameraPosition: (target: Vector3, distance: number, pitchRad: number, bearingRad: number) => Vector3;
    /**
     * Get current scene state
     * 获取当前场景状态
     * @returns Object containing center position and camera position 包含中心位置和相机位置的对象
     */
    getState(): {
        centerPosition: Vector3;
        cameraPosition: Vector3;
    };
    /**
     * Bind map instance
     * 绑定地图实例
     * @param map Map instance 地图实例
     *
     * @protected
     */
    _bindMap(map: Map): void;
    /**
     * Get associated map instance
     * 获取关联的地图实例
     * @returns Map instance or null 地图实例或null
     */
    getMap(): Map | null;
    /**
     * Get current browser window aspect ratio.
     * 获取当前浏览器窗口的宽高比（aspect ratio）。
     * @returns {number} Aspect ratio (width / height), e.g., returns ~1.777 for 16:9 screen. 宽高比（width / height），例如 16:9 的屏幕返回 ~1.777。
     */
    getAspect(): number;
    /**
     * 获取当前浏览器窗口的实际宽度和高度（视口尺寸）。
     * @returns {Array<number>} 包含宽度和高度的数组 [width, height]，单位是像素。
     */
    getWidthHeight(): number[];
    /**
     * Create the default ground plane.
     * 创建默认地面平面
     *
     * @description
     * Creates a large ground plane mesh that serves as a visual base when no tile layers are present.
     * The ground is positioned at y=0 and centered at the map center.
     * 创建一个大型地面网格，当没有瓦片图层时作为视觉基底。
     * 地面位于 y=0 并以地图中心为中心。
     *
     * @param config Ground configuration 地面配置
     * @returns Ground mesh. 地面网格
     * @internal
     */
    private _createDefaultGround;
    /**
     * Show the default ground plane.
     * 显示默认地面平面
     *
     * @description
     * Makes the default ground plane visible. This is typically called automatically
     * when no tile layers are present in the map.
     * 使默认地面平面可见。通常在地图中没有瓦片图层时自动调用。
     */
    showDefaultGround(): void;
    /**
     * Update the default ground plane position.
     * 更新默认地面平面位置
     *
     * @description
     * Recalculates and updates the ground plane position based on current map center.
     * This should be called after the map's root group transformation is finalized.
     * 根据当前地图中心重新计算并更新地面位置。
     * 应在地图根组变换完成后调用。
     *
     * @internal
     */
    _updateDefaultGroundPosition(): void;
    /**
     * Hide the default ground plane.
     * 隐藏默认地面平面
     *
     * @description
     * Hides the default ground plane. This is typically called automatically
     * when tile layers are added to the map.
     * 隐藏默认地面平面。通常在向地图添加瓦片图层时自动调用。
     */
    hideDefaultGround(): void;
    /**
     * Check if the default ground plane is visible.
     * 检查默认地面平面是否可见
     *
     * @returns Whether the ground is visible. 地面是否可见
     */
    isDefaultGroundVisible(): boolean;
    /**
     * Set the default ground plane visibility.
     * 设置默认地面平面可见性
     *
     * @param visible Whether the ground is visible. 地面是否可见
     */
    setDefaultGroundVisible(visible: boolean): void;
    /**
     * Set the default ground plane style.
     * 设置默认地面平面样式
     *
     * @param style Style properties. 样式属性
     */
    setDefaultGroundStyle(style: {
        color?: string | number;
        opacity?: number;
    }): void;
    /**
     * 销毁sceneRenderer实例，释放所有资源
     * @description
     * 该方法会清理以下资源：
     * 1. 停止动画循环
     * 2. 销毁控制器
     * 3. 清理场景中的所有对象
     * 4. 销毁渲染器
     * 5. 销毁后期处理器
     * 6. 移除DOM元素
     */
    destroy(): void;
    /**
     * Dispose material resources
     * 销毁材质资源
     * @param material Material to dispose 要销毁的材质
     */
    private _disposeMaterial;
}
export {};
