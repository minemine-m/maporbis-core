import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike } from "../types";

/** 
 * UIMarker content type
 * UIMarker 内容类型 
  * @category UI
 */
export type UIMarkerContent =
    | string
    | HTMLElement
    | ((container: HTMLElement) => void);

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
export class UIMarker extends UIComponent {
    declare options: UIMarkerOptions;

    /** 
     * Current marker coordinate
     * 当前标记点坐标 
     */
    private _markerCoord: LngLatLike;
    /** 
     * Content cache
     * 内容缓存 
     */
    private _content: UIMarkerContent;

    constructor(options: UIMarkerOptions) {
        super({
            single: false, // UIMarker allows multiple instances by default UIMarker 默认允许同图多实例共存
            ...options,
        });

        this._markerCoord = [...options.coordinate] as LngLatLike;
        this._content = options.content;
    }

    protected _getClassName(): string {
        return "UIMarker";
    }

    /**
     * Build UIMarker DOM
     * 构建 UIMarker 的 DOM
     */
    protected buildOn(): HTMLElement {
        const dom = document.createElement("div");

        // 宽高
        const { width, height } = this.options;
        if (typeof width === "number") {
            dom.style.width = `${width}px`;
        }
        if (typeof height === "number") {
            dom.style.height = `${height}px`;
        }

        // 样式类：containerClass + 额外 class
        const extraClass = this.options.containerClass;
        if (extraClass) {
            const classes = Array.isArray(extraClass) ? extraClass : [extraClass];
            classes.forEach((cls) => dom.classList.add(cls));
        }

        // Content rendering
        // 内容渲染
        const content = this._content;
        if (typeof content === "function") {
            content(dom);
        } else if (content instanceof HTMLElement) {
            dom.appendChild(content);
        } else if (typeof content === "string") {
            dom.innerHTML = content;
        }

        // Here we can add some basic DOM events if needed -> this.fire(...)
        // For simplicity, let the caller bind events on the dom directly
        // 这里可以根据需要加一些基础的 DOM 事件 → this.fire(...)
        // 为了保持简单，先只交给调用方自己在 dom 上绑事件

        return dom;
    }

    /**
     * Position offset: default centers the marker on the coordinate
     * 位置偏移：默认让标记点中心落在坐标位置上
     */
    protected override getOffset(): { x: number; y: number } {
        const base = super.getOffset();
        const dom = (this as any)._dom as HTMLElement | undefined;
        if (!dom) {
            return base;
        }

        const width = dom.offsetWidth;
        const height = dom.offsetHeight;

        return {
            x: base.x - width / 2,
            y: base.y - height / 2,
        };
    }

    /**
     * Show: updates internal coordinate if a new one is provided
     * 显示：如果传了新坐标，就更新内部坐标
     */
    override show(coordinate?: LngLatLike): this {
        if (coordinate) {
            this._markerCoord = [...coordinate] as LngLatLike;
        }
        // Pass to base class, let UIComponent handle unified lngLatToWorld + position update logic
        // 传给基类，让 UIComponent 走统一的 lngLatToWorld + 位置更新逻辑
        return super.show(this._markerCoord);
    }

    /**
     * 设置坐标（会触发重新定位）
     */
    setLngLatLikes(coordinate: LngLatLike): this {
        this._markerCoord = [...coordinate] as LngLatLike;
        if (this.isVisible()) {
            // 复用 show 的逻辑，让 UIComponent 更新 _coordinate 和位置
            super.show(this._markerCoord);
        }
        return this;
    }

    /**
     * 获取当前坐标
     */
    getLngLatLikes(): LngLatLike {
        return [...this._markerCoord] as LngLatLike;
    }

    /**
     * 
     */
    getCenter(): LngLatLike {
        return this.getLngLatLikes();
    }

    /**
     * 获取高度（优先坐标的 z，再退回 options.altitude）
     */
    getAltitude(): number {
        const coord = this._markerCoord as any;
        if (typeof coord[2] === "number") {
            return coord[2];
        }
        return typeof this.options.altitude === "number" ? this.options.altitude : 0;
    }

    /**
     * 设置高度：内部直接改第三个分量
     */
    setAltitude(alt: number): this {
        const coord = [...this._markerCoord] as any;
        coord[2] = alt;
        this._markerCoord = coord as LngLatLike;
        if (this.isVisible()) {
            super.show(this._markerCoord);
        }
        return this;
    }

    /**
     * 设置内容：如果当前已显示，会立即更新 DOM
     */
    setContent(content: UIMarkerContent): this {
        this._content = content;
        this.options.content = content;

        const dom = (this as any)._dom as HTMLElement | undefined;
        if (!dom) {
            return this;
        }

        // 重新渲染
        dom.innerHTML = "";
        if (typeof content === "function") {
            content(dom);
        } else if (content instanceof HTMLElement) {
            dom.appendChild(content);
        } else if (typeof content === "string") {
            dom.innerHTML = content;
        }

        return this;
    }

    getContent(): UIMarkerContent {
        return this._content;
    }
    override addTo(owner: any): this {
        // 先让 UIComponent 做 owner/map 绑定和事件注册
        super.addTo(owner);

        // 默认：addTo 后直接显示
        if (this.options.visible !== false) {
            this.show(this.options.coordinate);
        }

        return this;
    }
}