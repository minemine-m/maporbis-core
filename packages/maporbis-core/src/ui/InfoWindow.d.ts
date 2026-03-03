import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike } from "../types";
/**
 * InfoWindow options.
 * InfoWindow 配置项
  * @category UI
 */
export type InfoWindowOptions = UIComponentOptions & {
    /**
     * Title text.
     * 标题文本
     */
    title?: string;
    /**
     * Content, can be HTML string or HTMLElement.
     * 内容，可以是 HTML 字符串或 HTMLElement
     */
    content?: string | HTMLElement;
    /**
     * Minimum width.
     * 最小宽度
     */
    minWidth?: number;
    /**
     * Minimum height.
     * 最小高度
     */
    minHeight?: number;
    /**
     * Custom mode: if true, do not render default title bar / content box, directly use DOM/HTML provided by user.
     * 自定义模式：true 时不渲染默认标题栏/内容框，直接使用用户提供的 DOM/HTML
     */
    custom?: boolean;
};
/**
 * InfoWindow Component.
 * 信息窗口组件
 * @extends UIComponent
  * @category UI
 */
export declare class InfoWindow extends UIComponent {
    options: InfoWindowOptions;
    private _titleEl?;
    private _contentEl?;
    /**
     * @param options InfoWindow options InfoWindow 配置
     */
    constructor(options: InfoWindowOptions);
    protected _getClassName(): string;
    /**
     * Build InfoWindow DOM structure.
     * 构建 InfoWindow 的 DOM 结构
     */
    protected buildOn(): HTMLElement;
    protected getOffset(): {
        x: number;
        y: number;
    };
    /**
     * Calculate actual pixel height of Sprite on screen
     * 计算 Sprite 在屏幕上的实际像素高度
     *
     * @description
     * Handles both sizeAttenuation=false (fixed screen size) and sizeAttenuation=true (perspective projection) cases.
     * 处理 sizeAttenuation=false（固定屏幕大小）和 sizeAttenuation=true（透视投影）两种情况。
     */
    private _getSpriteScreenHeight;
    /**
     * Set title.
     * 设置标题
     */
    setTitle(title?: string): this;
    /**
     * Set content.
     * 设置内容
     */
    setContent(content: string | HTMLElement): this;
    /**
     * Open InfoWindow (semantically equivalent to show).
     * 打开 InfoWindow（语义上等价于 show）
     * @param coordinate Optional geographic coordinate, use owner center / map center if not provided 可选地理坐标，不传则使用 owner 的中心 / 地图中心
     */
    open(coordinate?: LngLatLike): this;
    /**
     * Close InfoWindow (semantically equivalent to hide).
     * 关闭 InfoWindow（语义上等价于 hide）
     */
    close(): this;
}
