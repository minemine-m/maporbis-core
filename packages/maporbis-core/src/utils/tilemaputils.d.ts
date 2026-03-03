import { Camera, PerspectiveCamera, Vector3 } from "three";
import { Map } from "../map";
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
export declare function getLocalFromMouse(mouseEvent: {
    currentTarget: any;
    clientX: number;
    clientY: number;
}, map: Map, camera: Camera): Vector3 | undefined;
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
export declare function limitCameraHeight(map: Map, camera: PerspectiveCamera, limitHeight?: number): boolean;
