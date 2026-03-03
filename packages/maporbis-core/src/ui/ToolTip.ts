import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike, Anchor } from "../types";
import { normalizeAnchor } from "../types";

/**
 * ToolTip content type.
 * ToolTip 内容类型
  * @category UI
 */
export type ToolTipContent =
    | string
    | HTMLElement
    | ((container: HTMLElement) => void);

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
export class ToolTip extends UIComponent {
    declare options: ToolTipOptions;

    private _content?: ToolTipContent;
    private _timeoutId: number | undefined;
    private _boundOnOwnerMove = (e: any) => this._onOwnerMove(e);
    private _boundOnOwnerOut = () => this._onOwnerOut();
    private _boundOnOwnerRemoved = () => this._onOwnerRemoved();
    /** 
     * Coordinate for standalone mode
     * 独立模式坐标 
     */
    private _standaloneCoord?: LngLatLike;

    /**
     * @param options ToolTip options ToolTip 配置
     */
    constructor(options: ToolTipOptions = {}) {
        super({
            single: false, // tooltip usually not global singleton tooltip 通常不做全局单例
            ...options,
        });
        this._content = options.content;
    }

    protected _getClassName(): string {
        return "ToolTip";
    }

    /**
     * Build ToolTip DOM structure.
     * 构建 ToolTip 的 DOM 结构
     */
    protected buildOn(): HTMLElement {
        const container = document.createElement("div");
        const inner = document.createElement("div");

        // Default style class name, can be configured in CSS via maporbis-tooltip
        // 默认样式类名，可以在 CSS 里配 maporbis-tooltip
        inner.className = "maporbis-tooltip";

        const extraClass = this.options.containerClass;
        if (extraClass) {
            const classes = Array.isArray(extraClass) ? extraClass : [extraClass];
            classes.forEach((cls) => {
                inner.classList.add(cls);
            });
        }

        const { width, height } = this.options;
        if (typeof width === "number") {
            inner.style.width = `${width}px`;
        }
        if (typeof height === "number") {
            inner.style.height = `${height}px`;
        }

        const content = this._content;
        if (typeof content === "function") {
            content(inner);
        } else if (content instanceof HTMLElement) {
            inner.appendChild(content);
        } else if (typeof content === "string") {
            inner.innerHTML = content;
        }

        container.appendChild(inner);
        return container;
    }

    /**
     * Calculate offset based on DOM size and anchor position.
     * 根据 DOM 尺寸和锚点位置计算偏移量
     */
    protected override getOffset(): { x: number; y: number } {
        const base = super.getOffset();
        const dom = (this as any)._dom as HTMLElement | undefined;
        if (!dom) {
            return base;
        }

        const width = dom.offsetWidth;
        const height = dom.offsetHeight;
        // Normalize anchor to handle both named and numeric formats
        // 标准化锚点以支持命名和数值格式
        const anchorArray = normalizeAnchor(this.options.anchor || 'top');
        const gap = 10; // Gap between tooltip and point 提示框与点之间的间隙

        let offsetX = base.x;
        let offsetY = base.y;

        // For named anchors, use string-based positioning
        // 对于命名锚点，使用基于字符串的定位
        const anchor = this.options.anchor || 'top';
        if (typeof anchor === 'string') {
            // Calculate offset based on anchor position
            // 根据锚点位置计算偏移
            switch (anchor) {
                case 'top':
                    offsetX = base.x - width / 2;
                    offsetY = base.y - height - gap;
                    break;
                case 'bottom':
                    offsetX = base.x - width / 2;
                    offsetY = base.y + gap;
                    break;
                case 'left':
                    offsetX = base.x - width - gap;
                    offsetY = base.y - height / 2;
                    break;
                case 'right':
                    offsetX = base.x + gap;
                    offsetY = base.y - height / 2;
                    break;
                case 'top-left':
                    offsetX = base.x - width - gap;
                    offsetY = base.y - height - gap;
                    break;
                case 'top-right':
                    offsetX = base.x + gap;
                    offsetY = base.y - height - gap;
                    break;
                case 'bottom-left':
                    offsetX = base.x - width - gap;
                    offsetY = base.y + gap;
                    break;
                case 'bottom-right':
                    offsetX = base.x + gap;
                    offsetY = base.y + gap;
                    break;
                case 'center':
                    offsetX = base.x - width / 2;
                    offsetY = base.y - height / 2;
                    break;
            }
        } else {
            // For numeric anchors [x, y], calculate position based on normalized coordinates
            // 对于数值锚点 [x, y]，根据标准化坐标计算位置
            // anchorArray[0] represents horizontal: 0=left, 0.5=center, 1=right
            // anchorArray[1] represents vertical: 0=bottom, 0.5=middle, 1=top
            offsetX = base.x - width * anchorArray[0];
            offsetY = base.y - height * (1 - anchorArray[1]);
        }

        return {
            x: offsetX,
            y: offsetY,
        };
    }

    /**
     * Bind to feature or map. The key is to bind mouse move/leave events to owner.
     * 绑定到要素或地图。这里重点是给 owner 绑鼠标移动/离开事件。
     */
    override addTo(owner: any): this {
        this._owner = owner;

        // If coordinate is provided in options, this is standalone mode
        // 如果配置中提供了坐标，这是独立模式
        if (this.options.coordinate) {
            this._standaloneCoord = [...this.options.coordinate] as LngLatLike;
        }

        // Hand over to base class to complete map binding logic
        // 先交给基类完成 map 绑定等逻辑
        super.addTo(owner);

        // In standalone mode with persistent flag, show immediately
        // 独立模式且持久显示时，立即显示
        if (this._standaloneCoord && this.options.persistent) {
            this.show(this._standaloneCoord);
        }

        // If persistent mode, don't bind mouse events
        // If standalone mode, don't bind mouse events (no owner feature)
        // 如果是持久模式，不绑定鼠标事件
        // 如果是独立模式，不绑定鼠标事件（没有 owner 要素）
        if (!this.options.persistent && !this._standaloneCoord && owner && typeof owner.on === "function") {
            owner.on("mousemove", this._boundOnOwnerMove);
            owner.on("mouseout", this._boundOnOwnerOut);
            owner.on("removed", this._boundOnOwnerRemoved);
        }

        return this;
    }

    /**
     * Internal: Handle owner move event.
     * 内部：处理 owner 移动事件
     */
    private _onOwnerMove(e: any): void {
        const map = this.getMap();
        if (!map) {
            return;
        }

        if (this._timeoutId != null) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = undefined;
        }

        const coordinate: LngLatLike =
            e?.coordinate ??
            (this._owner && typeof this._owner.getLngLatLike === "function"
                ? this._owner.getLngLatLike()
                : (map as any).getCenter?.());

        const delay = this.options.showTimeout ?? 400;

        const doShow = () => {
            // Base class show: create DOM, record coordinate, but hide first
            // 基类 show：创建 DOM，记录坐标，但先隐藏
            super.show(coordinate);

            const anyThis = this as any;
            // Let this update position and show directly
            // 直接让这一次更新位置并显示
            anyThis._positionedOnce = true;
            anyThis._refreshDomPosition();

            if (anyThis._dom) {
                anyThis._dom.style.display = "block";
            }
        };

        if (delay <= 0) {
            doShow();
        } else {
            this._timeoutId = window.setTimeout(doShow, delay);
        }
    }

    /**
     * Internal: Handle owner out event.
     * 内部：处理 owner 离开事件
     */
    private _onOwnerOut(): void {
        if (this._timeoutId != null) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = undefined;
        }
        this.hide();
    }

    /**
     * Internal: Handle owner removed event.
     * 内部：处理 owner 移除事件
     */
    private _onOwnerRemoved(): void {
        this.remove();
    }

    /**
     * Set coordinate for standalone mode.
     * 设置独立模式坐标
     */
    setCoordinate(coordinate: LngLatLike): this {
        this._standaloneCoord = [...coordinate] as LngLatLike;
        if (this.isVisible()) {
            this.show(this._standaloneCoord);
        }
        return this;
    }

    /**
     * Get current coordinate (standalone mode).
     * 获取当前坐标（独立模式）
     */
    getCoordinate(): LngLatLike | undefined {
        return this._standaloneCoord ? [...this._standaloneCoord] as LngLatLike : undefined;
    }

    /**
     * Set content.
     * 设置内容
     */
    setContent(content: ToolTipContent): this {
        this._content = content;
        this.options.content = content;

        const dom = (this as any)._dom as HTMLElement | undefined;
        if (!dom) {
            return this;
        }

        // Find the inner element with maporbis-tooltip class
        // 找到带 maporbis-tooltip 类的内部元素
        const inner = dom.querySelector('.maporbis-tooltip') as HTMLElement;
        if (!inner) {
            return this;
        }

        inner.innerHTML = '';
        if (typeof content === 'function') {
            content(inner);
        } else if (content instanceof HTMLElement) {
            inner.appendChild(content);
        } else if (typeof content === 'string') {
            inner.innerHTML = content;
        }

        return this;
    }

    /**
     * Show ToolTip at specific coordinate (for standalone mode).
     * 在指定坐标显示 ToolTip（用于独立模式）
     */
    override show(coordinate?: LngLatLike): this {
        // If standalone mode and no coordinate provided, use stored coordinate
        // 如果是独立模式且没有提供坐标，使用存储的坐标
        const coord = coordinate || this._standaloneCoord;
        
        if (!coord && !this._owner) {
            console.warn('ToolTip: coordinate required for standalone mode');
            return this;
        }

        // Call base class show
        // 调用基类 show
        super.show(coord);

        const anyThis = this as any;
        // Let this update position and show directly
        // 直接让这一次更新位置并显示
        anyThis._positionedOnce = true;
        anyThis._refreshDomPosition();

        if (anyThis._dom) {
            anyThis._dom.style.display = 'block';
        }

        return this;
    }

    protected override onRemove(): void {
        if (this._timeoutId != null) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = undefined;
        }
        const owner = this._owner;
        if (owner && typeof owner.off === "function") {
            owner.off("mousemove", this._boundOnOwnerMove);
            owner.off("mouseout", this._boundOnOwnerOut);
            owner.off("removed", this._boundOnOwnerRemoved);
        }
        this._owner = undefined;
        this._standaloneCoord = undefined;
    }
}
