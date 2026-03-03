import { Vector3 } from 'three';
import { Point } from './Point';
import { _createBasicPoint, _createIconPoint, _createIconLabelSprite } from '../utils/createobject';
/** Default marker configuration. 默认标记点配置 */
const options = {
// 默认配置项
};
/**
 * Marker feature class.
 * 标记点要素类
 *
 * @description
 * Represents a marker feature in the 3D scene, inheriting from the Point class.
 * Supports various marker styles:
 * - Basic point style
 * - Icon point style
 * - Icon point style with label
 *
 * 表示3D场景中的标记点要素，继承自Point类
 * 提供多种标记点样式支持：
 * - 基础点样式
 * - 图标点样式
 * - 带标签的图标点样式
 *
 * @extends Point
  * @category Feature
 */
export class Marker extends Point {
    /**
     * Create a marker feature instance.
     * 创建标记点要素实例
     *
     * @param options - Marker configuration options. 标记点配置选项
     */
    constructor(options) {
        super(options);
        /**
         * Feature type identifier.
         * 要素类型标识
         */
        Object.defineProperty(this, "_type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Marker'
        });
    }
    /**
     * Convert feature to Three.js geometry.
     * 将要素转换为Three.js几何体
     *
     * @description
     * Creates marker geometry based on style configuration and performs coordinate transformation.
     * 根据样式配置创建标记点几何体，并进行坐标转换
     *
     * @returns Promise<void>
     */
    async _buildRenderObject() {
        this._worldCoordinates = this._coordsTransform();
        if (this._paint) {
            if (this._renderObject) {
                this._disposeGeometry();
            }
            this._renderObject = await this._createObject(this._paint);
            this._refreshCoordinates();
        }
    }
    /**
     * Quickly update geometry vertex positions (without rebuilding the entire geometry).
     * 快速更新几何体顶点位置（不重建整个几何体）
     *
     * @description
     * Used for real-time interactions like dragging and editing. Updates only Marker position without destroying and rebuilding geometry.
     * This is much faster than full rebuild and keeps the feature visible during dragging.
     *
     * 用于拖拽、编辑等实时交互场景，仅更新Marker的位置而不销毁重建几何体。
     * 这比完整重建快得多，并且能保持feature在拖拽过程中可见。
     */
    _refreshCoordinates() {
        // 重新计算坐标
        this._worldCoordinates = this._coordsTransform();
        // 如果几何体已存在，仅更新位置
        if (this._renderObject) {
            // 更新位置
            this._renderObject.position.copy(this._worldCoordinates);
            // 确保几何体在场景中（关键：防止编辑时消失）
            if (!this.children.includes(this._renderObject)) {
                this.add(this._renderObject);
            }
            // 强制更新矩阵
            this.updateMatrixWorld(true);
            this._renderObject.updateMatrixWorld(true);
        }
        else {
            // 如果几何体不存在，调用完整重建
            this._buildRenderObject();
        }
    }
    /**
     * Create marker object.
     * 创建标记点对象
     *
     * @description
     * Supports the following style types:
     * 支持以下样式类型：
     * - 'basic-point': 基础点样式
     * - 'icon-point': 图标点样式
     * - 'icon-label-point': 带标签的图标点样式
     *
     * @param style - 样式配置
     * @returns 创建的标记点对象
     * @throws 如果样式类型不支持会抛出错误
     */
    async _createObject(paint) {
        switch (paint.config.type) {
            case 'circle':
                return _createBasicPoint(paint.config, new Vector3(0, 0, 0));
            case 'icon':
                return _createIconPoint(paint.config, this._worldCoordinates);
            case 'symbol':
                return _createIconLabelSprite(paint.config, this._worldCoordinates);
            default:
                throw new Error(`不支持的样式类型: ${paint.config.type}`);
        }
    }
    /**
     * Calculate collision bounding box (different strategies based on type)
     * 计算碰撞检测用的屏幕空间包围盒（根据不同类型使用不同的计算策略）
     *
     * @description
     * Override parent method, use different calculation strategies based on marker type (Sprite, Mesh, etc.)
     * Provides more precise bounding box calculation.
     *
     * 重写父类方法，根据标记点的具体类型（Sprite、Mesh等）使用不同的计算策略
     * 提供更精确的包围盒计算
     *
     * @param camera - Current camera 当前相机
     * @param renderer - Renderer instance 渲染器实例
     * @returns Bounding box info or null (if calculation failed) 包围盒信息或null（如果计算失败）
     */
    _calculateCollisionBoundingBox(camera, renderer) {
        if (!this.visible || !this._renderObject || !camera || !renderer) {
            return null;
        }
        try {
            // Select calculation strategy based on geometry type
            // 根据几何体类型选择不同的计算策略
            switch (this._paint?.config.type) {
                case 'icon':
                    return this._calculateSpriteBoundingBox(this._renderObject);
                // case this._renderObject instanceof Mesh:
                //     return this._calculateMeshBoundingBox(
                //         this._renderObject as Mesh,
                //         screenCenterX,
                //         screenCenterY,
                //         camera,
                //         renderer
                //     );
                // case 'isLine' in this._renderObject && (this._renderObject as any).isLine:
                //     return this._calculateLineBoundingBox(
                //         this._renderObject as any,
                //         screenCenterX,
                //         screenCenterY,
                //         camera,
                //         renderer
                //     );
                // case this._renderObject instanceof Object3D:
                //     // For standard Object3D, use default bounding box calculation
                //     // 对于普通的Object3D，使用默认的包围盒计算
                //     return this._calculateDefaultBoundingBox(
                //         this._renderObject,
                //         screenCenterX,
                //         screenCenterY,
                //         camera,
                //         renderer
                //     );
                default:
                    // console.warn(`Marker: Unknown geometry type`, this._renderObject);
                    // console.warn(`Marker: 未知的几何体类型`, this._renderObject);
                    return this._getFallbackBoundingBox();
            }
        }
        catch (error) {
            console.warn(`Marker ${this._id} bounding box calculation failed:`, error);
            console.warn(`Marker ${this._id} 包围盒计算失败:`, error);
            return this._getFallbackBoundingBox();
        }
    }
    /**
     * Calculate Sprite screen space bounding box - based on actual display
     * 计算Sprite的屏幕空间包围盒 - 基于实际显示
     *
     * @description
     * Precise bounding box calculation for Sprite type markers,
     * estimating actual screen size based on Sprite scale.
     *
     * 针对Sprite类型的标记点进行精确的包围盒计算，
     * 基于Sprite的缩放比例估算实际屏幕尺寸
     *
     * @param sprite - Sprite object Sprite对象
     * @returns Bounding box info or null (if calculation failed) 包围盒信息或null（如果计算失败）
     * @private
     */
    _calculateSpriteBoundingBox(sprite) {
        const pixelsToUnit = 0.002;
        try {
            // Use Sprite scale as reference directly (simplest way)
            // 直接使用Sprite的scale作为参考（最简单）
            const scaleBasedSize = Math.max(Math.abs(sprite.scale.x), Math.abs(sprite.scale.y)) / pixelsToUnit;
            return {
                width: scaleBasedSize,
                height: scaleBasedSize,
                offsetX: -scaleBasedSize / 2,
                offsetY: -scaleBasedSize / 2
            };
        }
        catch (error) {
            // Return reasonable default on failure
            // 失败时返回合理的默认值
            return {
                width: 20,
                height: 20,
                offsetX: -10,
                offsetY: -10
            };
        }
    }
    /**
     * Get fallback simple bounding box
     * 获取备用的简单包围盒
     *
     * @description
     * Returns different default sizes based on style type when precise calculation fails.
     *
     * 当精确计算失败时，根据样式类型返回不同的默认尺寸
     *
     * @returns Default bounding box info 默认包围盒信息
     */
    _getFallbackBoundingBox() {
        // Return different default sizes based on style type
        // 根据样式类型返回不同的默认尺寸
        const paintType = this.getPaint()?.config.type;
        switch (paintType) {
            case 'icon':
            case 'symbol':
                return { width: 20, height: 20, offsetX: -10, offsetY: -10 };
            case 'circle':
                return { width: 10, height: 10, offsetX: -5, offsetY: -5 };
            default:
                return { width: 15, height: 15, offsetX: -7.5, offsetY: -7.5 };
        }
    }
}
// 合并默认配置
Marker.mergeOptions(options);
