import { Object3D, Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { PointOptions, Point } from './Point';
import { Paint } from '../style';
/**
 * Marker feature configuration options.
 * 标记点要素配置选项
 *
 * @extends PointOptions
  * @category Feature
 */
export type MarkerOptions = PointOptions & {};
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
export declare class Marker extends Point {
    /**
     * Feature type identifier.
     * 要素类型标识
     */
    _type: string;
    /**
     * Create a marker feature instance.
     * 创建标记点要素实例
     *
     * @param options - Marker configuration options. 标记点配置选项
     */
    constructor(options: MarkerOptions);
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
    _buildRenderObject(): Promise<void>;
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
    protected _refreshCoordinates(): void;
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
    _createObject(paint: Paint): Promise<Object3D>;
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
    _calculateCollisionBoundingBox(camera: Camera, renderer: WebGLRenderer | WebGPURenderer): {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    } | null;
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
    private _calculateSpriteBoundingBox;
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
    _getFallbackBoundingBox(): {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    };
}
