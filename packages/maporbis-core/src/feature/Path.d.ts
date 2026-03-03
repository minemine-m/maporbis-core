import { Vector3 } from 'three';
import { Feature, FeatureOptions } from './Feature';
import { LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString } from 'geojson';
/**
 * Path feature configuration options.
 * 路径要素配置选项
 *
 * @extends FeatureOptions
  * @category Feature
 */
export type PathOptions = FeatureOptions & {
    /**
     * GeoJSON geometry data.
     * GeoJSON几何数据
     */
    geometry?: GeoJSONLineString | GeoJSONMultiLineString;
};
/**
 * Path feature abstract base class.
 * 路径要素抽象基类
 *
 * @description
 * Represents a path feature in the 3D scene, inheriting from Feature class.
 * Provides basic functionality for path features, including:
 * - LngLatLike transformation
 * - Geometry creation
 *
 * 表示3D场景中的路径要素，继承自Feature类
 * 提供路径要素的基础功能，包括：
 * - 坐标转换
 * - 几何体创建
 *
 * @abstract
 * @extends Feature
  * @category Feature
 */
export declare abstract class Path extends Feature {
    /**
     * Create a Path feature instance.
     * 创建路径要素实例
     *
     * @param options Path configuration options
     *                路径配置选项
     */
    constructor(options: PathOptions);
    /**
     * LngLatLike transformation method.
     * 坐标转换方法
     *
     * @returns Transformed coordinate array
     *          转换后的坐标数组
     *
     * @description
     * Convert geographic coordinates to world coordinates, supporting the following geometry types:
     * - LineString (Line)
     * - MultiLineString (Multi-line)
     * - Polygon (Polygon)
     * - MultiPolygon (Multi-polygon)
     *
     * 将地理坐标转换为世界坐标，支持以下几何类型：
     * - LineString (线)
     * - MultiLineString (多线)
     * - Polygon (面)
     * - MultiPolygon (多面)
     *
     * @throws Throws error if geometry type is not supported
     *         如果几何类型不支持会抛出错误
     */
    _coordsTransform(): Vector3[] | Vector3[][] | Vector3[][][];
    /**
     * Convert feature to Three.js geometry (abstract method).
     * 将要素转换为Three.js几何体（抽象方法）
     *
     * @abstract
     *
     * @description
     * Subclasses must implement this method to convert transformed coordinates to Three.js geometry.
     * 子类必须实现此方法，将转换后的坐标转换为Three.js几何体
     */
    _buildRenderObject(): void;
    /**
     * Create path object (abstract method).
     * 创建路径对象（抽象方法）
     *
     * @abstract
     *
     * @description
     * Subclasses must implement this method to create specific path objects based on style.
     * 子类必须实现此方法，根据样式创建具体的路径对象
     */
    _createObject(): void;
}
