import { Feature, FeatureOptions } from './Feature';
import { LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString } from 'geojson';
import { Line2 } from 'three-stdlib';
/**
 * Line feature configuration options.
 * 线要素配置选项
 *
 * @extends FeatureOptions
  * @category Feature
 */
export type LineOptions = FeatureOptions & {
    /**
     * GeoJSON line geometry data.
     * GeoJSON线几何数据
     */
    geometry?: GeoJSONLineString | GeoJSONMultiLineString;
};
/**
 * Line feature abstract base class.
 * 线要素抽象基类
 *
 * @description
 * Represents a line feature in the 3D scene, inheriting from the Feature class.
 * Provides basic functionality for line features, including:
 * - LngLatLike transformation
 * - Line geometry creation
 * - Style application
 *
 * 表示3D场景中的线要素，继承自Feature类
 * 提供线要素的基础功能，包括：
 * - 坐标转换
 * - 线几何体创建
 * - 样式应用
 *
 * @abstract
 * @extends Feature
  * @category Feature
 */
export declare abstract class Line extends Feature {
    /**
     * Base type identifier.
     * 基础类型标识
     */
    readonly _baseType = "Line";
    /**
     * Specific line type identifier (implemented by subclasses).
     * 具体线类型标识（由子类实现）
     */
    abstract _type: string;
    /**
     * Array of vertex coordinates.
     * 顶点坐标数组
     */
    _vertexPoints: number[];
    /**
     * Create a Line feature instance.
     * 创建线要素实例
     *
     * @param options Line feature configuration
     *                线要素配置
     */
    constructor(options: LineOptions);
    /**
     * LngLatLike transformation method.
     * 坐标转换方法
     *
     * @returns Transformed coordinate information
     *          转换后的坐标信息
     *
     * @description
     * Converts geographic coordinates to world coordinates and calculates coordinates relative to map center.
     *
     * 将地理坐标转换为世界坐标，并计算相对于地图中心的坐标
     */
    _coordsTransform(): any;
    /**
     * Convert to Three.js geometry (abstract method).
     * 转换为Three.js几何体（抽象方法）
     *
     * @abstract
     */
    _buildRenderObject(): void;
    /**
     * Create basic line geometry.
     * 创建基础线几何体
     *
     * @returns Line2 instance
     *          Line2实例
     *
     * @protected
     * @description
     * Creates line geometry with default material. Subclasses can extend or override this method.
     *
     * 创建带有默认材质的线几何体，子类可扩展或重写此方法
     */
    protected _createRenderObject(): Line2;
}
