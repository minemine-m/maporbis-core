import { Object3D } from 'three';
import { LineOptions, Line } from './Line';
import { Paint } from '../style';
/**
 * LineString feature configuration options.
 * 线要素配置选项
 *
 * @extends LineOptions
  * @category Feature
 */
export type LineStringOptions = LineOptions & {};
/**
 * LineString feature class.
 * 线要素类
 *
 * @description
 * Represents a line feature in the 3D scene, inheriting from the Line base class.
 * Provides functionality for creating, updating, and rendering line features, supporting basic line styles.
 *
 * 表示3D场景中的线要素，继承自Line基类
 * 提供线要素的创建、更新和渲染功能，支持基础线样式
 *
 * @extends Line
 * @category Feature
 */
export declare class LineString extends Line {
    /**
     * Feature type identifier.
     * 要素类型标识
     */
    _type: string;
    /**
     * Create a LineString feature instance.
     * 创建线要素实例
     *
     * @param options Configuration options for the line feature
     *                线要素配置
     */
    constructor(options: LineStringOptions);
    /**
     * Convert feature to Three.js geometry.
     * 将要素转换为Three.js几何体
     *
     * @returns Promise<void>
     *
     * @description
     * Creates line geometry based on style configuration and performs coordinate transformation.
     *
     * 根据样式配置创建线几何体，并进行坐标转换
     */
    _buildRenderObject(): Promise<void>;
    /**
     * Quickly update geometry vertex positions (without rebuilding the entire geometry).
     * 快速更新几何体顶点位置（不重建整个几何体）
     *
     * @description
     * Used for real-time interactions like dragging and editing. Updates only Line2 vertex positions without destroying and rebuilding geometry.
     * This is much faster than full rebuild and keeps the feature visible during dragging.
     *
     * 用于拖拽、编辑等实时交互场景，仅更新Line2的顶点位置而不销毁重建几何体。
     * 这比完整重建快得多，并且能保持feature在拖拽过程中可见。
     */
    protected _refreshCoordinates(): void;
    /**
     * Create line object.
     * 创建线对象
     *
     * @param style - Style configuration 样式配置
     * @returns Created line object 创建的线对象
     * @throws Throws error if style type is not supported 如果样式类型不支持会抛出错误
     *
     * @description
     * Currently supported style types:
     * - 'basic-line': Basic line style
     *
     * 当前支持样式类型：
     * - 'basic-line': 基础线样式
     */
    _createObject(paint: Paint): Promise<Object3D>;
}
