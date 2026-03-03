import { UIComponent } from "./UIComponent";
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
    constructor(options) {
        super({
            single: false, // UIMarker allows multiple instances by default UIMarker 默认允许同图多实例共存
            ...options,
        });
        /**
         * Current marker coordinate
         * 当前标记点坐标
         */
        Object.defineProperty(this, "_markerCoord", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Content cache
         * 内容缓存
         */
        Object.defineProperty(this, "_content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._markerCoord = [...options.coordinate];
        this._content = options.content;
    }
    _getClassName() {
        return "UIMarker";
    }
    /**
     * Build UIMarker DOM
     * 构建 UIMarker 的 DOM
     */
    buildOn() {
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
        }
        else if (content instanceof HTMLElement) {
            dom.appendChild(content);
        }
        else if (typeof content === "string") {
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
    getOffset() {
        const base = super.getOffset();
        const dom = this._dom;
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
    show(coordinate) {
        if (coordinate) {
            this._markerCoord = [...coordinate];
        }
        // Pass to base class, let UIComponent handle unified lngLatToWorld + position update logic
        // 传给基类，让 UIComponent 走统一的 lngLatToWorld + 位置更新逻辑
        return super.show(this._markerCoord);
    }
    /**
     * 设置坐标（会触发重新定位）
     */
    setLngLatLikes(coordinate) {
        this._markerCoord = [...coordinate];
        if (this.isVisible()) {
            // 复用 show 的逻辑，让 UIComponent 更新 _coordinate 和位置
            super.show(this._markerCoord);
        }
        return this;
    }
    /**
     * 获取当前坐标
     */
    getLngLatLikes() {
        return [...this._markerCoord];
    }
    /**
     *
     */
    getCenter() {
        return this.getLngLatLikes();
    }
    /**
     * 获取高度（优先坐标的 z，再退回 options.altitude）
     */
    getAltitude() {
        const coord = this._markerCoord;
        if (typeof coord[2] === "number") {
            return coord[2];
        }
        return typeof this.options.altitude === "number" ? this.options.altitude : 0;
    }
    /**
     * 设置高度：内部直接改第三个分量
     */
    setAltitude(alt) {
        const coord = [...this._markerCoord];
        coord[2] = alt;
        this._markerCoord = coord;
        if (this.isVisible()) {
            super.show(this._markerCoord);
        }
        return this;
    }
    /**
     * 设置内容：如果当前已显示，会立即更新 DOM
     */
    setContent(content) {
        this._content = content;
        this.options.content = content;
        const dom = this._dom;
        if (!dom) {
            return this;
        }
        // 重新渲染
        dom.innerHTML = "";
        if (typeof content === "function") {
            content(dom);
        }
        else if (content instanceof HTMLElement) {
            dom.appendChild(content);
        }
        else if (typeof content === "string") {
            dom.innerHTML = content;
        }
        return this;
    }
    getContent() {
        return this._content;
    }
    addTo(owner) {
        // 先让 UIComponent 做 owner/map 绑定和事件注册
        super.addTo(owner);
        // 默认：addTo 后直接显示
        if (this.options.visible !== false) {
            this.show(this.options.coordinate);
        }
        return this;
    }
}
