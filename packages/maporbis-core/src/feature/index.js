/**
 * @module Geometry
 */
/**
 * Import Marker class
 * 导入Marker类
 * @description Basic marker class for creating point features
 *              基础标记点类，用于创建点状要素
 */
import { Marker } from './Marker';
/**
 * Import LineString class
 * 导入LineString类
 * @description Line feature class for creating line features
 *              线要素类，用于创建线状要素
 */
import { LineString } from './LineString';
/**
 * Import Surface class
 * 导入Surface类
 * @description Surface feature abstract base class
 *              表面要素抽象基类
 */
import { Surface } from './Surface';
/**
 * Import Polygon class
 * 导入Polygon类
 * @description Polygon feature class for creating polygon features
 *              面要素类，用于创建多边形要素
 */
import { Polygon } from './Polygon';
/**
 * Import Edit extension
 * 导入编辑功能扩展
 * @description Add editing capabilities to Feature class
 *              为Feature类添加编辑功能
 */
import './ext/Feature.Edit';
/**
 * Export all geometry feature classes
 * 导出所有几何要素类
 * @description Centralized export of all geometry feature classes, including:
 *              集中导出所有几何要素类，包括：
 * - Marker: Point feature (点要素)
 * - LineString: Line feature (线要素)
 * - Polygon: Polygon feature (面要素)
 */
export { Feature } from './Feature';
export { Marker, LineString, Surface, Polygon };
export * from './Point';
export * from './Line';
export * from './Path';
export * from './internal';
