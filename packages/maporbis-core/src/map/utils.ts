import { Camera, Raycaster, Vector2, Vector3, Intersection } from "three";
import { Tile } from "../core/tile";
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
export function getLocalInfoFromRay(map: Map, ray: Raycaster) {
    // 找到底图图层（isBaseLayer === true）
    const baseLayer = map.getLayers().find((layer) => (layer as any).isBaseLayer === true) as any;
    
    // 如果没有底图或者底图没有rootTile，返回undefined
    if (!baseLayer || !baseLayer._rootTile) {
        return undefined;
    }

    const baseRootTile = baseLayer._rootTile;
    const intersects = ray.intersectObjects<Tile>([baseRootTile]);
    
    for (const intersect of intersects) {
        if (intersect.object instanceof Tile) {
            // intersect.point is in world space, convert to local map space
            // intersect.point 在世界坐标系中，需要转换到地图局部坐标系
            const worldPoint = intersect.point.clone();
            const localPoint = (map as any)._rootGroup.worldToLocal(worldPoint);
            
            const lonlat = map.pointToLngLat(localPoint);
            return Object.assign(intersect, {
                location: lonlat,
            }) as LocationInfo;
        }
    }
    return undefined;
}

/**
 * 通过世界坐标获取地面信息
 * @param map 地图实例
 * @param worldPosition 世界坐标
 * @returns 地面信息
 * @description 从指定世界坐标上方垂直向下投射射线检测地面
 * @category Map
 */
export function getLocalInfoFromWorld(map: Map, worldPosition: Vector3) {
    const downVec3 = new Vector3(0, -1, 0);
    // 原点（高空10km）
    const origin = new Vector3(worldPosition.x, 10 * 1000, worldPosition.z);
    // 从原点垂直地面向下做一条射线
    const ray = new Raycaster(origin, downVec3);
    return getLocalInfoFromRay(map, ray);
}

/**
 * 通过屏幕坐标获取地面信息
 * @param camera 相机
 * @param map 地图实例
 * @param pointer 屏幕坐标（-0.5~0.5）
 * @returns 地面信息
 * @description 从屏幕坐标投射射线检测地面
 * @category Map
 */
export function getLocalInfoFromScreen(camera: Camera, map: Map, pointer: Vector2) {
    const ray = new Raycaster();
    ray.setFromCamera(pointer, camera);
    return getLocalInfoFromRay(map, ray);
}

export function getLocalInfoFromGeo(map: Map, geo: Vector3) {
    const pointer = map.lngLatToWorld(geo);
    return getLocalInfoFromWorld(map, pointer);
}

/**
 * 获取近似缩放级别
 * @param camera 相机
 * @param map 地图
 * @returns 缩放级别
 */
export function getApproxZoomLevel(_camera: Camera, map: Map): number {
    return map.getZoom();
}

