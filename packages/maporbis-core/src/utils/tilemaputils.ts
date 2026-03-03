import {
    Camera,
    MathUtils,
    PerspectiveCamera,
    Vector2,
    Vector3,
} from "three";
import { Map } from "../map";
import { getLocalInfoFromScreen, getLocalInfoFromWorld } from "../map/utils";

/**
 * 从鼠标事件获取本地坐标
 * @param mouseEvent 鼠标事件对象
 * @param map 地图实例
 * @param camera 相机对象
 * @returns 本地坐标向量，如果无法获取则返回undefined
 * 
 * @description
 * 该方法将鼠标事件中的屏幕坐标转换为地图的本地坐标
 * 转换过程：
 * 1. 获取鼠标在元素内的相对位置
 * 2. 转换为标准化设备坐标（NDC）
 * 3. 通过地图服务获取对应的本地坐标
 *  * @category Utils
 */
export function getLocalFromMouse(
    mouseEvent: { currentTarget: any; clientX: number; clientY: number },
    map: Map,
    camera: Camera
): Vector3 | undefined {
    const { currentTarget: target, clientX: x, clientY: y } = mouseEvent;
    if (target instanceof HTMLElement) {
        const width = target.clientWidth;
        const height = target.clientHeight;
        // 将鼠标坐标转换为标准化设备坐标（-1到1范围）
        const pointer = new Vector2((x / width) * 2 - 1, -(y / height) * 2 + 1);
        // 从地图服务获取本地坐标信息
        const info = getLocalInfoFromScreen(camera, map, pointer);
        return info?.location;
    } else {
        return undefined;
    }
}

/**
 * 获取地图数据来源的版权信息
 * @param map 地图实例
 * @returns 版权信息字符串数组
 * 
 * @description
 * 该方法收集地图中所有数据源的版权信息，包括：
 * - 图像数据源
 * - 高程数据源
 * 返回去重后的版权信息数组
 */
// export function getAttributions(map: Map) {
//     const attributions = new Set<string>();
//     // 处理图像数据源（支持数组或单个源）
//     const imgSources = Array.isArray(map.imgSource) ? map.imgSource : [map.imgSource];
//     imgSources.forEach(source => {
//         const attr = source.attribution;
//         attr && attributions.add(attr);
//     });
//     // 处理高程数据源（如果存在）
//     if (map.demSource) {
//         const attr = map.demSource.attribution;
//         attr && attributions.add(attr);
//     }
//     return Array.from(attributions);
// }

/**
 * 限制相机最小高度
 * @param map 地图实例
 * @param camera 透视相机对象
 * @param limitHeight 限制高度，默认为10单位
 * @returns 是否进行了高度调整
 * 
 * @description
 * 该方法确保相机不会低于指定的最小高度：
 * 1. 计算相机近截面下沿中点
 * 2. 转换为世界坐标
 * 3. 检测该点与地面的高度差
 * 4. 如果低于限制高度，则沿上方向调整相机位置
 * 
 * 调整策略：
 * - 当低于地面时，快速上移（1.1倍偏移）
 * - 当接近地面时，缓慢上移（1/20偏移）
 *  * @category Utils
 */
export function limitCameraHeight(map: Map, camera: PerspectiveCamera, limitHeight = 10) {
    // 计算近截面下沿中点（相机局部坐标系）
    const height = 2 * camera.near * Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const localPoint = new Vector3(0, -height / 2, -camera.near - height / 10); // 局部坐标
    const checkPoint = localPoint.applyMatrix4(camera.matrixWorld); // 转换为世界坐标系

    // 获取该点下方的地面高度信息
    const info = getLocalInfoFromWorld(map, checkPoint);

    let hit = false;

    if (info) {
        // 计算相机与地面的高度差
        const h = checkPoint.y - info.point.y;
        // 如果高度差小于限制高度
        if (h < limitHeight) {
            // 计算偏移量（根据是否低于地面采用不同策略）
            const offset = h < 0 ? -h * 1.1 : h / 20;
            // 获取地图上方向并计算偏移向量
            const dv = map.localToWorld(map.up.clone()).multiplyScalar(offset);
            // 调整相机位置
            camera.position.add(dv);
            hit = true;
        }
    }
    return hit;
}