import { Object3D, Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Line2 } from 'three-stdlib';
import { CollisionType, CollisionReason, IBoundingBox } from '../../core/collision/types/CollisionTypes';
/**
 * Internal collision configuration.
 * 内部碰撞配置
 */
export interface IFeatureCollisionConfig {
    enabled: boolean;
    priority: number;
    padding: number;
    minZoom: number;
    maxZoom: number;
}
/**
 * Bounding box calculation result.
 * 包围盒计算结果
 */
export interface IBoundingBoxResult {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
}
/**
 * Internal feature collision helper.
 * 内部要素碰撞辅助类
 *
 * @description
 * Manages collision detection state and bounding box calculations for features.
 * 管理要素的碰撞检测状态和包围盒计算
 *
 * @internal
 */
export declare class FeatureCollisionHelper {
    /** Collision state. 碰撞状态 */
    private _collisionState;
    /** Collision detection configuration. 碰撞检测配置 */
    private _collisionConfig;
    /** Animation reference ID. 动画引用标识 */
    private _animationRef;
    /** Feature ID. 要素ID */
    private _featureId;
    /** Render object getter. 渲染对象获取器 */
    private _getRenderObject;
    /** Feature visibility setter. 要素可见性设置器 */
    private _setFeatureVisibility;
    /** Feature alpha setter. 要素透明度设置器 */
    private _setFeatureAlpha;
    /**
     * Create a collision helper instance.
     * 创建碰撞辅助实例
     *
     * @param featureId - Feature unique identifier. 要素唯一标识
     * @param getRenderObject - Function to get current render object. 获取当前渲染对象的函数
     * @param setVisibility - Function to set feature visibility. 设置要素可见性的函数
     * @param setAlpha - Function to set feature alpha. 设置要素透明度的函数
     */
    constructor(featureId: string, getRenderObject: () => Object3D | Line2 | null, setVisibility: (visible: boolean) => void, setAlpha: (alpha: number) => void);
    /**
     * Get whether collision detection is enabled.
     * 获取是否启用碰撞检测
     */
    get collidable(): boolean;
    /**
     * Get collision priority.
     * 获取碰撞优先级
     *
     * @param userDataPriority - Priority from user data. 用户数据中的优先级
     * @param stylePriority - Priority from style. 样式中的优先级
     */
    getCollisionPriority(userDataPriority?: number, stylePriority?: number): number;
    /**
     * Get current collision visibility.
     * 获取当前碰撞可见性
     */
    getCollisionVisibility(): boolean;
    /**
     * Set collision visibility.
     * 设置碰撞可见性
     *
     * @param visible - Whether visible. 是否可见
     * @param reason - Reason for visibility change. 可见性变化原因
     */
    setCollisionVisibility(visible: boolean, reason?: CollisionReason): void;
    /**
     * Set collision detection configuration.
     * 设置碰撞检测配置
     *
     * @param config - Collision configuration options. 碰撞配置选项
     */
    setCollisionConfig(config: Partial<IFeatureCollisionConfig>): void;
    /**
     * Enable collision detection.
     * 启用碰撞检测
     */
    enableCollision(): void;
    /**
     * Disable collision detection.
     * 禁用碰撞检测
     */
    disableCollision(): void;
    /**
     * Get collision configuration.
     * 获取碰撞配置
     */
    getCollisionConfig(): IFeatureCollisionConfig;
    /**
     * Get screen space bounding box.
     * 获取屏幕空间包围盒
     *
     * @param camera - Current camera. 当前相机
     * @param renderer - Renderer instance. 渲染器实例
     * @param layerId - Layer ID. 图层ID
     * @param collisionType - Collision type. 碰撞类型
     * @param collisionData - Additional collision data. 附加碰撞数据
     */
    calculateScreenBoundingBox(camera: Camera, renderer: WebGLRenderer | WebGPURenderer, layerId: string, collisionType: CollisionType, collisionData: any): IBoundingBox | null;
    /**
     * Check if screen position is within bounds.
     * 检查屏幕位置是否在边界内
     */
    private _isInScreenBounds;
    /**
     * Calculate object bounding box in screen space.
     * 计算对象在屏幕空间中的包围盒
     */
    private _calculateObjectBoundingBox;
    /**
     * Get 8 corners of a bounding box.
     * 获取包围盒的8个角点
     */
    private _getBoxCorners;
    /**
     * pointToLngLat 3D corners to screen coordinates.
     * 将3D角点投影到屏幕坐标
     */
    private _projectCornersToScreen;
    /**
     * Calculate screen bounds from projected points.
     * 从投影点计算屏幕边界
     */
    private _calculateScreenBounds;
    /**
     * Get fallback bounding box.
     * 获取备用包围盒
     */
    _getFallbackBoundingBox(): IBoundingBoxResult;
}
