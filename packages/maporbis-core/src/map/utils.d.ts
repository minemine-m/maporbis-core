import { Camera, Raycaster, Vector2, Vector3, Intersection } from "three";
import { Map } from "./index";
/**
 * 地面位置信息类型
 * @extends Intersection
 * @description 扩展Three.js的相交检测结果，添加地理位置信息
 * @category Map
 */
export interface LocationInfo extends Intersection {
    /** 地理位置坐标（经纬度） */
    location: Vector3;
}
/**
 * 通过射线获取地面信息
 * @param map 地图实例
 * @param ray 射线检测器
 * @returns 相交信息或undefined（未相交时）
 * @description 检测射线与地图的相交点，并转换为地理位置坐标
 * @category Map
 */
export declare function getLocalInfoFromRay(map: Map, ray: Raycaster): LocationInfo | undefined;
/**
 * 通过世界坐标获取地面信息
 * @param map 地图实例
 * @param worldPosition 世界坐标
 * @returns 地面信息
 * @description 从指定世界坐标上方垂直向下投射射线检测地面
 * @category Map
 */
export declare function getLocalInfoFromWorld(map: Map, worldPosition: Vector3): LocationInfo | undefined;
/**
 * 通过屏幕坐标获取地面信息
 * @param camera 相机
 * @param map 地图实例
 * @param pointer 屏幕坐标（-0.5~0.5）
 * @returns 地面信息
 * @description 从屏幕坐标投射射线检测地面
 * @category Map
 */
export declare function getLocalInfoFromScreen(camera: Camera, map: Map, pointer: Vector2): LocationInfo | undefined;
export declare function getLocalInfoFromGeo(map: Map, geo: Vector3): LocationInfo | undefined;
/**
 * 获取近似缩放级别
 * @param camera 相机
 * @param map 地图
 * @returns 缩放级别
 */
export declare function getApproxZoomLevel(_camera: Camera, map: Map): number;
