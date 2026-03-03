import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike } from "../types";
/**
 * UIMarker content type
 * UIMarker 内容类型
  * @category UI
 */
export type UIMarkerContent = string | HTMLElement | ((container: HTMLElement) => void);
/**
 * UIMarker options
 * UIMarker 配置项
  * @category UI
 */
export type UIMarkerOptions = UIComponentOptions & {
    /**
     * Required: Geographic coordinate [lng, lat, alt?]
     * 必填：地理坐标 [lng, lat, alt?]
     */
    coordinate: LngLatLike;
    /**
     * Content: can be HTML string / DOM / render function
     * 内容，可以是 HTML 字符串 / DOM / 渲染函数
     */
    content: UIMarkerContent;
    /**
     * Width (pixels, optional)
     * 宽度（像素，可选）
     */
    width?: number;
    /**
     * Height (pixels, optional)
     * 高度（像素，可选）
     */
    height?: number;
    /**
     * Fallback altitude (used if z is missing in coordinate)
     * 备用高度（如果坐标里没 z，就用这个）
     */
    altitude?: number;
};
/**
 * UIMarker Component
 * UIMarker 组件
 *
 * @description
 * A DOM-based marker component that is anchored to a specific geographic coordinate on the map.
 * Updates its position automatically as the map moves or zooms.
 * 基于 DOM 的标记点组件，锚定在地图上的特定地理坐标。
 * 随地图移动或缩放自动更新位置。
  * @category UI
 */
export declare class UIMarker extends UIComponent {
    options: UIMarkerOptions;
    /**
     * Current marker coordinate
     * 当前标记点坐标
     */
    private _markerCoord;
    /**
     * Content cache
     * 内容缓存
     */
    private _content;
    constructor(options: UIMarkerOptions);
    protected _getClassName(): string;
    /**
     * Build UIMarker DOM
     * 构建 UIMarker 的 DOM
     */
    protected buildOn(): HTMLElement;
    /**
     * Position offset: default centers the marker on the coordinate
     * 位置偏移：默认让标记点中心落在坐标位置上
     */
    protected getOffset(): {
        x: number;
        y: number;
    };
    /**
     * Show: updates internal coordinate if a new one is provided
     * 显示：如果传了新坐标，就更新内部坐标
     */
    show(coordinate?: LngLatLike): this;
    /**
     * 设置坐标（会触发重新定位）
     */
    setLngLatLikes(coordinate: LngLatLike): this;
    /**
     * 获取当前坐标
     */
    getLngLatLikes(): LngLatLike;
    /**
     *
     */
    getCenter(): LngLatLike;
    /**
     * 获取高度（优先坐标的 z，再退回 options.altitude）
     */
    getAltitude(): number;
    /**
     * 设置高度：内部直接改第三个分量
     */
    setAltitude(alt: number): this;
    /**
     * 设置内容：如果当前已显示，会立即更新 DOM
     */
    setContent(content: UIMarkerContent): this;
    getContent(): UIMarkerContent;
    addTo(owner: any): this;
}
