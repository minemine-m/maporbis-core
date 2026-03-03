import { Object3D, Vector3, Camera, WebGLRenderer, Box3, Vector2 } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Line2 } from 'three-stdlib';
import { CollisionType, CollisionReason, IBoundingBox } from '../../core/collision/types/CollisionTypes';
import { ICollisionState } from '../../core/collision/interfaces/ICollidable';

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
export class FeatureCollisionHelper {
    /** Collision state. 碰撞状态 */
    private _collisionState: ICollisionState = {
        visible: true,
        reason: CollisionReason.NO_COLLISION,
        collidedWith: [],
        timestamp: Date.now()
    };

    /** Collision detection configuration. 碰撞检测配置 */
    private _collisionConfig: IFeatureCollisionConfig = {
        enabled: true,
        priority: 50,
        padding: 4,
        minZoom: 0,
        maxZoom: 24
    };

    /** Animation reference ID. 动画引用标识 */
    private _animationRef: number | null = null;

    /** Feature ID. 要素ID */
    private _featureId: string;

    /** Render object getter. 渲染对象获取器 */
    private _getRenderObject: () => Object3D | Line2 | null;

    /** Feature visibility setter. 要素可见性设置器 */
    private _setFeatureVisibility: (visible: boolean) => void;

    /** Feature alpha setter. 要素透明度设置器 */
    private _setFeatureAlpha: (alpha: number) => void;

    /**
     * Create a collision helper instance.
     * 创建碰撞辅助实例
     * 
     * @param featureId - Feature unique identifier. 要素唯一标识
     * @param getRenderObject - Function to get current render object. 获取当前渲染对象的函数
     * @param setVisibility - Function to set feature visibility. 设置要素可见性的函数
     * @param setAlpha - Function to set feature alpha. 设置要素透明度的函数
     */
    constructor(
        featureId: string,
        getRenderObject: () => Object3D | Line2 | null,
        setVisibility: (visible: boolean) => void,
        setAlpha: (alpha: number) => void
    ) {
        this._featureId = featureId;
        this._getRenderObject = getRenderObject;
        this._setFeatureVisibility = setVisibility;
        this._setFeatureAlpha = setAlpha;
    }

    /**
     * Get whether collision detection is enabled.
     * 获取是否启用碰撞检测
     */
    get collidable(): boolean {
        return this._collisionConfig.enabled;
    }

    /**
     * Get collision priority.
     * 获取碰撞优先级
     * 
     * @param userDataPriority - Priority from user data. 用户数据中的优先级
     * @param stylePriority - Priority from style. 样式中的优先级
     */
    getCollisionPriority(userDataPriority?: number, stylePriority?: number): number {
        return userDataPriority ?? stylePriority ?? this._collisionConfig.priority;
    }

    /**
     * Get current collision visibility.
     * 获取当前碰撞可见性
     */
    getCollisionVisibility(): boolean {
        return this._collisionState.visible;
    }

    /**
     * Set collision visibility.
     * 设置碰撞可见性
     * 
     * @param visible - Whether visible. 是否可见
     * @param reason - Reason for visibility change. 可见性变化原因
     */
    setCollisionVisibility(visible: boolean, reason: CollisionReason = CollisionReason.MANUAL_HIDDEN): void {
        if (this._collisionState.visible === visible) return;

        // Cancel previous animation
        if (this._animationRef !== null) {
            cancelAnimationFrame(this._animationRef);
            this._animationRef = null;
        }

        // Set visibility and alpha directly
        this._setFeatureVisibility(visible);
        this._setFeatureAlpha(visible ? 1 : 0);

        // Update collision state
        this._collisionState = {
            visible,
            reason,
            collidedWith: visible ? [] : this._collisionState.collidedWith,
            timestamp: Date.now()
        };
    }

    /**
     * Set collision detection configuration.
     * 设置碰撞检测配置
     * 
     * @param config - Collision configuration options. 碰撞配置选项
     */
    setCollisionConfig(config: Partial<IFeatureCollisionConfig>): void {
        Object.assign(this._collisionConfig, config);
    }

    /**
     * Enable collision detection.
     * 启用碰撞检测
     */
    enableCollision(): void {
        this._collisionConfig.enabled = true;
    }

    /**
     * Disable collision detection.
     * 禁用碰撞检测
     */
    disableCollision(): void {
        this._collisionConfig.enabled = false;
        this.setCollisionVisibility(true, CollisionReason.MANUAL_HIDDEN);
    }

    /**
     * Get collision configuration.
     * 获取碰撞配置
     */
    getCollisionConfig(): IFeatureCollisionConfig {
        return { ...this._collisionConfig };
    }

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
    calculateScreenBoundingBox(
        camera: Camera,
        renderer: WebGLRenderer | WebGPURenderer,
        layerId: string,
        collisionType: CollisionType,
        collisionData: any
    ): IBoundingBox | null {
        if (!this._collisionConfig.enabled) return null;

        const renderObject = this._getRenderObject();
        if (!renderObject) return null;

        try {
            // Calculate world coordinates and screen projection
            const worldPos = new Vector3();
            renderObject.getWorldPosition(worldPos);
            const screenPos = worldPos.clone().project(camera);

            // Check if in screen bounds
            const inFrustum = this._isInScreenBounds(screenPos);
            if (!inFrustum) return null;

            // Convert to pixel coordinates
            const { width, height } = renderer.domElement;
            const pixelX = (screenPos.x * 0.5 + 0.5) * width;
            const pixelY = (-screenPos.y * 0.5 + 0.5) * height;

            // Get feature specific bounding box
            const bbox = this._calculateObjectBoundingBox(camera, renderer);
            if (!bbox) return null;

            return {
                id: this._featureId,
                x: pixelX + bbox.offsetX,
                y: pixelY + bbox.offsetY,
                width: 20 + this._collisionConfig.padding * 2,
                height: 20 + this._collisionConfig.padding * 2,
                priority: this._collisionConfig.priority,
                featureId: this._featureId,
                layerId: layerId,
                type: collisionType,
                data: collisionData
            };

        } catch (error) {
            console.warn(`Feature ${this._featureId} bounding box calculation failed:`, error);
            return null;
        }
    }

    /**
     * Check if screen position is within bounds.
     * 检查屏幕位置是否在边界内
     */
    private _isInScreenBounds(screenPos: Vector3): boolean {
        return (
            screenPos.x >= -1.1 && screenPos.x <= 1.1 &&
            screenPos.y >= -1.1 && screenPos.y <= 1.1 &&
            screenPos.z >= -1 && screenPos.z <= 1
        );
    }

    /**
     * Calculate object bounding box in screen space.
     * 计算对象在屏幕空间中的包围盒
     */
    private _calculateObjectBoundingBox(
        camera: Camera,
        renderer: WebGLRenderer | WebGPURenderer
    ): IBoundingBoxResult | null {
        const renderObject = this._getRenderObject();
        if (!renderObject) return this._getFallbackBoundingBox();

        try {
            // Calculate world space bounding box
            const bbox = new Box3().setFromObject(renderObject as any);
            if (bbox.isEmpty()) return this._getFallbackBoundingBox();

            // Get 8 corners of the bounding box
            const corners = this._getBoxCorners(bbox);

            // pointToLngLat corners to screen space
            const { width: screenWidth, height: screenHeight } = renderer.domElement;
            const screenPoints = this._projectCornersToScreen(corners, camera, screenWidth, screenHeight);

            // Calculate bounding box in screen space
            const { minX, maxX, minY, maxY } = this._calculateScreenBounds(screenPoints);

            const pixelWidth = maxX - minX;
            const pixelHeight = maxY - minY;

            // Add minimum pixel size
            const minPixelSize = 4;
            const finalWidth = Math.max(pixelWidth, minPixelSize);
            const finalHeight = Math.max(pixelHeight, minPixelSize);

            // Calculate offset relative to feature center
            const worldCenter = new Vector3();
            bbox.getCenter(worldCenter);
            const ndcCenter = worldCenter.clone().project(camera);
            const screenCenterX = (ndcCenter.x * 0.5 + 0.5) * screenWidth;
            const screenCenterY = (-ndcCenter.y * 0.5 + 0.5) * screenHeight;

            return {
                width: finalWidth,
                height: finalHeight,
                offsetX: minX - screenCenterX,
                offsetY: minY - screenCenterY
            };

        } catch (error) {
            console.warn('Bounding box calculation failed:', error);
            return this._getFallbackBoundingBox();
        }
    }

    /**
     * Get 8 corners of a bounding box.
     * 获取包围盒的8个角点
     */
    private _getBoxCorners(bbox: Box3): Vector3[] {
        return [
            new Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
            new Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
            new Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
            new Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
            new Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
            new Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
            new Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
            new Vector3(bbox.max.x, bbox.max.y, bbox.max.z)
        ];
    }

    /**
     * pointToLngLat 3D corners to screen coordinates.
     * 将3D角点投影到屏幕坐标
     */
    private _projectCornersToScreen(
        corners: Vector3[],
        camera: Camera,
        screenWidth: number,
        screenHeight: number
    ): Vector2[] {
        return corners.map(corner => {
            const ndc = corner.clone().project(camera);
            const screenX = (ndc.x * 0.5 + 0.5) * screenWidth;
            const screenY = (-ndc.y * 0.5 + 0.5) * screenHeight;
            return new Vector2(screenX, screenY);
        });
    }

    /**
     * Calculate screen bounds from projected points.
     * 从投影点计算屏幕边界
     */
    private _calculateScreenBounds(screenPoints: Vector2[]): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        screenPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        });

        return { minX, maxX, minY, maxY };
    }

    /**
     * Get fallback bounding box.
     * 获取备用包围盒
     */
    _getFallbackBoundingBox(): IBoundingBoxResult {
        return {
            width: 20,
            height: 20,
            offsetX: -10,
            offsetY: -10
        };
    }
}
