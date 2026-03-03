import { Vector3 } from 'three';
import { Feature, FeatureOptions } from './Feature';
import { LineString as GeoJSONLineString, MultiLineString as GeoJSONMultiLineString } from 'geojson';
import { LngLatLike } from '../types';

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
export abstract class Path extends Feature {
    /**
     * Create a Path feature instance.
     * 创建路径要素实例
     * 
     * @param options Path configuration options
     *                路径配置选项
     */
    constructor(options: PathOptions) {
        super(options);
    }

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
    _coordsTransform() {
        const map = this.getMap();
        const geometry = this._geometry;

        // Process LineString type
        // 处理线类型 (LineString)
        if (geometry.type === 'LineString') {
            const coordinates = geometry.coordinates as LngLatLike[];
            return coordinates.map(coord => {
                const vec = new Vector3(coord[0], coord[1], coord[2] || 0);
                return map ? map.lngLatToWorld(vec) : vec;
            });
        }

        // Process MultiLineString or Polygon type
        // 处理多线类型 (MultiLineString) 或面类型 (Polygon)
        if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
            const coordinates = geometry.coordinates as LngLatLike[][];
            return coordinates.map(line =>
                line.map(coord => {
                    const vec = new Vector3(coord[0], coord[1], coord[2] || 0);
                    return map ? map.lngLatToWorld(vec) : vec;
                })
            );
        }

        // Process MultiPolygon type
        // 处理多多边形类型 (MultiPolygon)
        if (geometry.type === 'MultiPolygon') {
            const coordinates = geometry.coordinates as LngLatLike[][][];
            return coordinates.map(polygon =>
                polygon.map(ring =>
                    ring.map(coord => {
                        const vec = new Vector3(coord[0], coord[1], coord[2] || 0);
                        return map ? map.lngLatToWorld(vec) : vec;
                    })
                )
            );
        }

        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }

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
    _buildRenderObject() {
        // Implemented by subclass
        // 由子类实现具体逻辑
    }

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
    _createObject() {
        // Implemented by subclass
        // 由子类实现具体逻辑
    }
}