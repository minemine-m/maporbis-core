import { Feature, FeatureOptions } from './Feature';
import { Polygon as GeoJSONPolygon, MultiPolygon as GeoJSONMultiPolygon } from 'geojson';
import { Line2 } from 'three-stdlib';
/**
 * Surface feature configuration options.
 * 表面要素配置选项
 *
 * @extends FeatureOptions
  * @category Feature
 */
export type SurfaceOptions = FeatureOptions & {
    /**
     * GeoJSON polygon geometry data.
     * GeoJSON多边形几何数据
     */
    geometry?: GeoJSONPolygon | GeoJSONMultiPolygon;
};
/**
 * Surface feature abstract base class.
 * 表面要素抽象基类
 *
 * @description
 * Represents a surface feature in the 3D scene, inheriting from the Feature class.
 * Provides basic functionality for polygon surface features, including:
 * - LngLatLike transformation
 * - Geometry creation
 * - Style application
 *
 * 表示3D场景中的表面要素，继承自Feature类
 * 提供多边形表面要素的基础功能，包括：
 * - 坐标转换
 * - 几何体创建
 * - 样式应用
 *
 * @abstract
 * @extends Feature
  * @category Feature
 */
export declare abstract class Surface extends Feature {
    /**
     * Base type identifier.
     * 基础类型标识
     */
    readonly _baseType = "Surface";
    /**
     * Specific surface type identifier (implemented by subclasses).
     * 具体表面类型标识（由子类实现）
     */
    abstract _type: string;
    /**
     * Array of vertex coordinates.
     * 顶点坐标数组
     */
    _vertexPoints: number[];
    /**
     * Create a Surface feature instance.
     * 创建表面要素实例
     *
     * @param options Surface configuration
     *                表面配置
     */
    constructor(options: SurfaceOptions);
    _buildRenderObject(): void;
    /**
     * LngLatLike transformation method.
     * 坐标转换方法
     *
     * @returns Transformed coordinate information
     *          转换后的坐标信息
     *
     * @description
     * Handles coordinate transformation for Polygon and MultiPolygon, returning:
     * - _worldLngLatLikes: Array of transformed coordinates
     * - _vertexPoints: Array of flattened vertex coordinates
     *
     * 处理多边形和多面体的坐标转换，返回：
     * - _worldLngLatLikes: 转换后的坐标数组
     * - _vertexPoints: 展平的顶点坐标数组
     *
     * @throws Throws error if geometry type is not supported
     *         如果几何类型不支持会抛出错误
     */
    _coordsTransform(): any;
    /**
     * Update geometry.
     * 更新几何体
     *
     * @description
     * Updates geometry based on current style type:
     * - 'basic-polygon': Basic polygon
     * - 'extrude-polygon': Extruded polygon
     * - 'water': Water surface effect
     *
     * 根据当前样式类型更新几何体：
     * - 'basic-polygon': 基础多边形
     * - 'extrude-polygon': 挤出多边形
     * - 'water': 水面效果
     */
    protected _refreshLngLatLikes(): void;
    /**
     * Create basic geometry.
     * 创建基础几何体
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
