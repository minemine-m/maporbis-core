import { WebGLRenderer, Camera } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OverlayLayer } from '../../layer/OverlayLayer';
import { ICollisionConfig } from './types/CollisionTypes';
/**
 * Collision Detection and Avoidance Engine
 * 碰撞检测与避让引擎
 *
 * @description
 * Responsible for managing collision detection and avoidance strategies for map features.
 * Uses QuadTree spatial indexing and multiple avoidance strategies to ensure features
 * do not overlap during visualization, providing optimal readability.
 * 负责管理地图要素的碰撞检测和避让策略，通过四叉树空间索引和多种避让策略
 * 确保要素在可视化时不会相互重叠，提供最佳的可读性
 *
 * @example
 * ```typescript
 * const collisionEngine = new CollisionEngine(renderer, {
 *   enabled: true,
 *   maxFeaturesPerFrame: 1000
 * });
 * collisionEngine.registerLayer(mapLayer);
 * ```
  * @category Core
 */
export declare class CollisionEngine {
    private renderer;
    private _quadTreeManager;
    private _strategyOrchestrator;
    private _performanceMonitor;
    /**
     * Registered layers set
     * 注册的图层集合
     */
    private _layers;
    /**
     * Collision configuration
     * 碰撞检测配置
     */
    private _config;
    /**
     * Whether updating (prevent duplicate updates)
     * 是否正在更新中（防止重复更新）
     */
    private _isUpdating;
    /**
     * Last update timestamp
     * 上次更新时间戳
     */
    private _lastUpdateTime;
    /**
     * Frame counter
     * 帧计数器
     */
    private _frameCount;
    /**
     * Create collision detection engine instance
     * 创建碰撞检测引擎实例
     *
     * @param renderer - Three.js renderer instance Three.js 渲染器实例
     * @param config - Collision detection configuration options 碰撞检测配置选项
     */
    constructor(renderer: WebGLRenderer | WebGPURenderer, config?: Partial<ICollisionConfig>);
    /**
     * Update collision detection status
     * 更新碰撞检测状态
     *
     * @description
     * Executes collision detection and avoidance strategies based on current camera position
     * and feature states. Automatically controls update frequency to avoid performance issues.
     * 根据当前相机位置和要素状态，执行碰撞检测和避让策略，
     * 自动控制更新频率以避免性能问题
     *
     * @param camera - Current scene camera 当前场景相机
     * @returns Promise Async result after update completion 更新完成后的异步结果
     */
    update(camera: Camera): Promise<void>;
    /**
     * Reset visibility of all features
     * 重置所有要素的可见性
     *
     * @description
     * Ensures each update starts from a clean state, letting the avoidance engine
     * re-decide the visibility of each feature.
     * 确保每次更新都从干净状态开始，让避让引擎重新决策每个要素的可见性
     */
    private _resetAllFeaturesVisibility;
    /**
     * Register a layer to the collision detection engine
     * 注册图层到碰撞检测引擎
     *
     * @param layer - Overlay layer to register 要注册的覆盖图层
     * @returns Current engine instance (supports chaining) 当前引擎实例（支持链式调用）
     */
    registerLayer(layer: OverlayLayer): this;
    /**
     * Unregister a layer from the collision detection engine
     * 从碰撞检测引擎取消注册图层
     *
     * @param layer - Overlay layer to unregister 要取消注册的覆盖图层
     * @returns Current engine instance (supports chaining) 当前引擎实例（支持链式调用）
     */
    unregisterLayer(layer: OverlayLayer): this;
    /**
     * Update collision detection configuration
     * 更新碰撞检测配置
     *
     * @param newConfig - New configuration options 新的配置选项
     * @returns Current engine instance (supports chaining) 当前引擎实例（支持链式调用）
     */
    setConfig(newConfig: Partial<ICollisionConfig>): this;
    /**
     * Get performance statistics
     * 获取性能统计信息
     *
     * @returns Object containing performance metrics like FPS, processing time, etc. 包含帧率、处理时间等性能指标的对象
     */
    getPerformanceStats(): any;
    /**
     * Initialize internal engine components
     * 初始化引擎内部组件
     *
     * @description
     * Creates QuadTree manager, strategy orchestrator, and performance monitor,
     * and sets up viewport resize handling.
     * 创建四叉树管理器、策略协调器和性能监控器，
     * 并设置视口变化监听
     */
    private _initializeComponents;
    /**
     * Create collision detection context
     * 创建碰撞检测上下文
     *
     * @param camera - Current scene camera 当前场景相机
     * @param timestamp - Current timestamp 当前时间戳
     * @returns Collision detection context object 碰撞检测上下文对象
     */
    private _createCollisionContext;
    /**
     * Collect all collidable features
     * 收集所有可碰撞检测的要素
     *
     * @description
     * Filters features supporting collision detection from all registered layers,
     * and limits the maximum number of features processed per frame.
     * 从所有注册的图层中筛选出支持碰撞检测的要素，
     * 并限制每帧处理的最大数量
     *
     * @returns Array of collidable features 可碰撞检测的要素数组
     */
    private _collectCollidableFeatures;
    /**
     * Apply collision detection results to features
     * 应用碰撞检测结果到要素
     *
     * @description
     * Updates visibility status of each feature based on strategy execution results.
     * 根据策略执行结果更新每个要素的可见性状态
     *
     * @param results - Collision detection results map 碰撞检测结果映射表
     * @param features - Features array 要素数组
     * @returns Promise Async result after application 应用完成后的异步结果
     */
    private _applyCollisionResults;
    /**
     * Setup viewport resize handler
     * 设置视口变化监听器
     *
     * @description
     * Monitors renderer DOM element size changes and automatically updates QuadTree manager's viewport size.
     * 监听渲染器DOM元素尺寸变化，自动更新四叉树管理器的视口大小
     */
    private _setupViewportResizeHandler;
    /**
     * 设置性能监控
     *
     * 定期检查性能统计信息，在性能下降时输出警告
     */
    private _setupPerformanceMonitoring;
}
