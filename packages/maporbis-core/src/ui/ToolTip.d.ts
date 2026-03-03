import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike, Anchor } from "../types";
/**
 * ToolTip content type.
 * ToolTip 内容类型
  * @category UI
 */
export type ToolTipContent = string | HTMLElement | ((container: HTMLElement) => void);
/**
 * ToolTip options.
 * ToolTip 配置项
  * @category UI
 */
export type ToolTipOptions = UIComponentOptions & {
    /**
     * Width.
     * 宽度
     */
    width?: number;
    /**
     * Height.
     * 高度
     */
    height?: number;
    /**
     * Show timeout (ms), 0 means show immediately.
     * 延时显示（毫秒），0 表示立即显示
     */
    showTimeout?: number;
    /**
     * Content.
     * 提示内容
     */
    content?: ToolTipContent;
    /**
     * Persistent mode: always visible, not affected by mouse events.
     * 持久模式：始终可见，不受鼠标事件影响
     */
    persistent?: boolean;
    /**
     * Anchor position: determines where ToolTip appears relative to the coordinate point.
     * Default is 'top' (appears above the point).
     * 锚点位置：决定 ToolTip 相对于坐标点的显示位置。
     * 默认为 'top'（显示在点的上方）
     * @example 'top-right' | 'center' | [0.5, 0.5]
     */
    anchor?: Anchor;
    /**
     * Coordinate for standalone mode: allows ToolTip to be added directly to map without a feature.
     * When provided, ToolTip will be positioned at this coordinate.
     * 独立模式坐标：允许 ToolTip 直接添加到地图上而不依赖要素。
     * 提供时，ToolTip 将定位在此坐标处。
     */
    coordinate?: LngLatLike;
};
/**
 * ToolTip Component.
 * 提示框组件
 * @extends UIComponent
  * @category UI
 */
export declare class ToolTip extends UIComponent {
    options: ToolTipOptions;
    private _content?;
    private _timeoutId;
    private _boundOnOwnerMove;
    private _boundOnOwnerOut;
    private _boundOnOwnerRemoved;
    /**
     * Coordinate for standalone mode
     * 独立模式坐标
     */
    private _standaloneCoord?;
    /**
     * @param options ToolTip options ToolTip 配置
     */
    constructor(options?: ToolTipOptions);
    protected _getClassName(): string;
    /**
     * Build ToolTip DOM structure.
     * 构建 ToolTip 的 DOM 结构
     */
    protected buildOn(): HTMLElement;
    /**
     * Calculate offset based on DOM size and anchor position.
     * 根据 DOM 尺寸和锚点位置计算偏移量
     */
    protected getOffset(): {
        x: number;
        y: number;
    };
    /**
     * Bind to feature or map. The key is to bind mouse move/leave events to owner.
     * 绑定到要素或地图。这里重点是给 owner 绑鼠标移动/离开事件。
     */
    addTo(owner: any): this;
    /**
     * Internal: Handle owner move event.
     * 内部：处理 owner 移动事件
     */
    private _onOwnerMove;
    /**
     * Internal: Handle owner out event.
     * 内部：处理 owner 离开事件
     */
    private _onOwnerOut;
    /**
     * Internal: Handle owner removed event.
     * 内部：处理 owner 移除事件
     */
    private _onOwnerRemoved;
    /**
     * Set coordinate for standalone mode.
     * 设置独立模式坐标
     */
    setCoordinate(coordinate: LngLatLike): this;
    /**
     * Get current coordinate (standalone mode).
     * 获取当前坐标（独立模式）
     */
    getCoordinate(): LngLatLike | undefined;
    /**
     * Set content.
     * 设置内容
     */
    setContent(content: ToolTipContent): this;
    /**
     * Show ToolTip at specific coordinate (for standalone mode).
     * 在指定坐标显示 ToolTip（用于独立模式）
     */
    show(coordinate?: LngLatLike): this;
    protected onRemove(): void;
}
