import { Vector2, Vector3 } from 'three';
import { Feature, FeatureOptions } from './Feature';
import { LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString } from 'geojson';
import { Line2, LineMaterial, LineGeometry } from 'three-stdlib';
import { LngLatLike } from '../types';

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
export abstract class Line extends Feature {
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
    constructor(options: LineOptions) {
        super(options);
        this._renderObject = this._createRenderObject();
        this._vertexPoints = [0, 0, 0];
        if (this._paint) {
            this._paint.applyTo(this._renderObject);
        }
    }

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
    _coordsTransform(): any {
        const map = this.getMap();
        const geometry = this._geometry;
        const center = map?.prjcenter as Vector3;

        if (this._geometry.type === 'LineString') {
            const coordinates = geometry.coordinates as LngLatLike[];
            let _worldLngLatLikes = coordinates.map(coord => {
                const vec = new Vector3(coord[0], coord[1], coord[2] || 0);
                const worldPos = map ? map.lngLatToWorld(vec) : vec;
                return worldPos.sub(center);
            });

            let _vertexPoints = (_worldLngLatLikes as Vector3[]).flatMap(v => [v.x, v.y, v.z]);
            return {
                _worldLngLatLikes,
                _vertexPoints
            }
        }
    }

    /**
     * Convert to Three.js geometry (abstract method).
     * 转换为Three.js几何体（抽象方法）
     * 
     * @abstract
     */
    _buildRenderObject() {
        // Implemented by subclasses
    }

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
    protected _createRenderObject() {
        const geometry = new LineGeometry();
        const material = new LineMaterial({
            color: 0x888888,
            linewidth: 0.1,
            dashed: false,
            resolution: new Vector2(window.innerWidth, window.innerHeight)
        });
        return new Line2(geometry, material);
    }
}