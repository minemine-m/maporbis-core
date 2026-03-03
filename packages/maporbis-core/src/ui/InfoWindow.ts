import { UIComponent, type UIComponentOptions } from "./UIComponent";
import type { LngLatLike } from "../types";
import { normalizeAnchor } from "../types";
import { Vector3, Sprite, SpriteMaterial } from "three";

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
export class InfoWindow extends UIComponent {
    declare options: InfoWindowOptions;

    private _titleEl?: HTMLElement;
    private _contentEl?: HTMLElement;

    /**
     * @param options InfoWindow options InfoWindow 配置
     */
    constructor(options: InfoWindowOptions) {
        super({
            single: true,
            ...options,
        });
    }

    protected _getClassName(): string {
        return "InfoWindow";
    }

    /**
     * Build InfoWindow DOM structure.
     * 构建 InfoWindow 的 DOM 结构
     */
    protected buildOn(): HTMLElement {
        // custom mode: completely customized by caller, do not render default title bar and content container
        // custom 模式：完全由调用方自定义 DOM 结构，不渲染默认标题栏和内容容器
        if (this.options.custom) {
            let dom: HTMLElement;

            if (this.options.content instanceof HTMLElement) {
                // Directly use DOM provided by caller as InfoWindow root node
                // 直接使用调用方提供的 DOM 作为 InfoWindow 的根节点
                dom = this.options.content;
            } else {
                dom = document.createElement("div");
                if (typeof this.options.content === "string") {
                    dom.innerHTML = this.options.content;
                }
            }

            // Allow caller to add class names via containerClass (keep consistent with UIComponentOptions)
            // 允许调用方通过 containerClass 继续加类名（保持和 UIComponentOptions 一致）
            const extraClass = this.options.containerClass;
            if (extraClass) {
                const classes = Array.isArray(extraClass) ? extraClass : [extraClass];
                classes.forEach((cls) => {
                    dom.classList.add(cls);
                });
            }

            // Support min width/height config
            // 支持最小宽高配置
            if (this.options.minWidth) {
                dom.style.minWidth = `${this.options.minWidth}px`;
            }
            if (this.options.minHeight) {
                dom.style.minHeight = `${this.options.minHeight}px`;
            }

            // In custom mode, no longer maintain title element, only treat the whole dom as content container
            // 在 custom 模式下，不再维护标题元素，只把整个 dom 当作内容容器
            this._titleEl = undefined;
            this._contentEl = dom;

            return dom;
        }

        // Non-custom: use default InfoWindow structure (title bar + close button + content + small triangle)
        // 非 custom：使用默认 InfoWindow 结构（标题栏 + 关闭按钮 + 内容 + 小三角）
        const container = document.createElement("div");
        container.className = "maporbis-infowindow";

        const extraClass = this.options.containerClass;
        if (extraClass) {
            const classes = Array.isArray(extraClass) ? extraClass : [extraClass];
            classes.forEach((cls) => {
                container.classList.add(cls);
            });
        }

        if (typeof this.options.zIndex === "number") {
            container.style.zIndex = String(this.options.zIndex);
        }

        if (this.options.minWidth) {
            container.style.minWidth = `${this.options.minWidth}px`;
        }
        if (this.options.minHeight) {
            container.style.minHeight = `${this.options.minHeight}px`;
        }

        const header = document.createElement("div");
        header.className = "maporbis-infowindow-header";

        const titleEl = document.createElement("div");
        titleEl.className = "maporbis-infowindow-title";
        if (this.options.title) {
            titleEl.textContent = this.options.title;
        }

        const closeEl = document.createElement("span");
        closeEl.className = "maporbis-infowindow-close";
        closeEl.innerHTML = "×";
        closeEl.title = "关闭";

        closeEl.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.close();
        });

        // Prevent default behavior, avoid selecting text etc.
        // 阻止默认行为，避免选中文本等
        closeEl.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });

        closeEl.style.cursor = "pointer";
        closeEl.style.userSelect = "none";

        header.appendChild(titleEl);
        header.appendChild(closeEl);

        const contentEl = document.createElement("div");
        contentEl.className = "maporbis-infowindow-content";

        if (this.options.content instanceof HTMLElement) {
            contentEl.appendChild(this.options.content);
        } else if (typeof this.options.content === "string") {
            contentEl.innerHTML = this.options.content;
        }

        container.appendChild(header);
        container.appendChild(contentEl);

        this._titleEl = titleEl;
        this._contentEl = contentEl;

        return container;
    }

    protected override getOffset(): { x: number; y: number } {
        const base = super.getOffset();
        const dom = this._dom;
        if (!dom) {
            return base;
        }

        const width = dom.offsetWidth;
        const height = dom.offsetHeight;
        const triangleHeight = 10; // Consistent with triangle height in maporbis.css 与 maporbis.css 中三角高度保持一致

        // Original logic: let triangle tip point to "coordinate point"
        // 先按照原来的逻辑，让三角尖指向"坐标点"
        let offsetX = base.x - width / 2;
        let offsetY = base.y - height - triangleHeight;

        // === Extra processing: if owner is a point with icon (Marker / Point + icon-* style),
        // lift InfoWindow up by a distance, so small triangle points to icon top ===
        // === 额外处理：如果 owner 是带 icon 的点（Marker / Point + icon-* 样式），
        // 就再把 InfoWindow 往上抬一段距离，让小三角指到 icon 顶部 ===
        const owner: any = (this as any)._owner;
        const map: any = this.getMap();
        
        if (owner && typeof owner.getStyle === "function" && map?.sceneRenderer) {
            const style = owner.getStyle?.();
            const cfg = style?.config as any;
            const type = cfg?.type;

            if (cfg && (type === "icon-point" || type === "icon-label-point")) {
                // anchor [x, y], y=0 means bottom, y=1 means top
                // anchor [x, y]，y=0 表示底部，y=1 表示顶部
                // Use normalizeAnchor to support both named and numeric formats
                // 使用 normalizeAnchor 支持命名和数值格式
                const anchor = normalizeAnchor(cfg.anchor);
                const anchorY = anchor[1];

                // Try to get actual screen height of sprite
                // 尝试获取 sprite 的实际屏幕高度
                let iconScreenHeight = 0;
                const sprite = owner._renderObject;

                if (sprite && sprite instanceof Sprite) {
                    // Calculate actual screen height by calculating screen position difference between top and bottom of sprite
                    // 通过计算 sprite 顶部和底部的屏幕位置差来获取实际屏幕高度
                    iconScreenHeight = this._getSpriteScreenHeight(sprite, map.sceneRenderer);
                }

                // If unable to get sprite height, fallback to config value (compatible with old logic)
                // 如果无法获取 sprite 高度，回退到配置值（兼容旧逻辑）
                if (iconScreenHeight <= 0) {
                    let iconHeight = 0;
                    if (type === "icon-point") {
                        const size = cfg.size;
                        if (Array.isArray(size)) {
                            iconHeight = size[1];
                        } else if (typeof size === "number") {
                            iconHeight = size;
                        }
                    } else if (type === "icon-label-point") {
                        const rawIconSize = (cfg as any).size ?? cfg.iconSize;
                        if (Array.isArray(rawIconSize)) {
                            iconHeight = rawIconSize[1];
                        } else if (typeof rawIconSize === "number") {
                            iconHeight = rawIconSize;
                        }
                    }
                    iconScreenHeight = iconHeight * (1 - anchorY);
                } else {
                    // Calculate distance from anchor to top using actual screen height
                    // 用实际屏幕高度计算从锚点到顶部的距离
                    iconScreenHeight = iconScreenHeight * (1 - anchorY);
                }

                if (iconScreenHeight > 0) {
                    offsetY -= iconScreenHeight;
                }
            }
        }

        return {
            x: offsetX,
            y: offsetY,
        };
    }

    /**
     * Calculate actual pixel height of Sprite on screen
     * 计算 Sprite 在屏幕上的实际像素高度
     * 
     * @description
     * Handles both sizeAttenuation=false (fixed screen size) and sizeAttenuation=true (perspective projection) cases.
     * 处理 sizeAttenuation=false（固定屏幕大小）和 sizeAttenuation=true（透视投影）两种情况。
     */
    private _getSpriteScreenHeight(sprite: Sprite, sceneRenderer: any): number {
        try {
            const camera = sceneRenderer.camera;
            const renderer = sceneRenderer.renderer;
            if (!camera || !renderer) return 0;

            const canvasHeight = sceneRenderer.height || renderer.domElement.clientHeight;

            // Check material sizeAttenuation setting
            // 检查材质的 sizeAttenuation 设置
            const material = sprite.material as SpriteMaterial;
            const sizeAttenuation = material.sizeAttenuation !== false; // Default true 默认 true

            if (!sizeAttenuation) {
                // When sizeAttenuation=false, sprite pixel size on screen is fixed
                // Three.js formula for Sprite screen pixel size when sizeAttenuation=false:
                // screenPixelHeight = sprite.scale.y * projectionMatrix[5] * canvasHeight / 2
                // where projectionMatrix[5] = 1 / tan(fov/2) for perspective camera
                
                // sizeAttenuation=false 时，sprite 在屏幕上的像素大小是固定的
                // Three.js 对于 sizeAttenuation=false 的 Sprite，其屏幕像素大小计算公式：
                // screenPixelHeight = sprite.scale.y * projectionMatrix[5] * canvasHeight / 2
                // 其中 projectionMatrix[5] = 1 / tan(fov/2) 对于透视相机
                const projY = camera.projectionMatrix.elements[5];
                return sprite.scale.y * projY * canvasHeight / 2;
            }

            // When sizeAttenuation=true, need to calculate actual screen height via projection
            // sizeAttenuation=true 时，需要通过投影计算实际屏幕高度
            
            // Get sprite world position
            // 获取 sprite 的世界位置
            const worldPos = new Vector3();
            sprite.getWorldPosition(worldPos);

            // Get direction from camera to sprite
            // 获取相机到 sprite 的视线方向
            const cameraPos = camera.position.clone();
            const toSprite = worldPos.clone().sub(cameraPos).normalize();
            
            // Calculate "up" direction in camera space (perpendicular to view direction)
            // For Sprite, it always faces camera, so use camera right vector cross view direction to get true up direction
            // 计算相机空间中的"上"方向（与视线垂直）
            // 对于 Sprite，它总是面向相机，所以使用相机的右向量和视线叉乘得到真正的上方向
            const cameraRight = new Vector3();
            cameraRight.crossVectors(camera.up, toSprite).normalize();
            const spriteUp = new Vector3();
            spriteUp.crossVectors(toSprite, cameraRight).normalize();
            
            // Calculate top and bottom offset based on anchor
            // 根据锚点计算顶部和底部偏移
            const topOffset = sprite.scale.y * (1 - sprite.center.y);
            const bottomOffset = sprite.scale.y * sprite.center.y;
            
            const topPos = worldPos.clone().add(spriteUp.clone().multiplyScalar(topOffset));
            const bottomPos = worldPos.clone().sub(spriteUp.clone().multiplyScalar(bottomOffset));

            // Project world coordinates to NDC
            // 将世界坐标投影到 NDC
            const topNDC = topPos.clone().project(camera);
            const bottomNDC = bottomPos.clone().project(camera);

            // Convert to screen pixel coordinates (Y axis top to bottom)
            // 转换为屏幕像素坐标（Y 轴从上到下）
            const topScreenY = (-topNDC.y * 0.5 + 0.5) * canvasHeight;
            const bottomScreenY = (-bottomNDC.y * 0.5 + 0.5) * canvasHeight;

            // Return screen pixel height (absolute value)
            // 返回屏幕像素高度（绝对值）
            return Math.abs(bottomScreenY - topScreenY);
        } catch (e) {
            console.warn("Failed to calculate sprite screen height: // 计算 sprite 屏幕高度失败:", e);
            return 0;
        }
    }

    /**
     * Set title.
     * 设置标题
     */
    setTitle(title?: string): this {
        this.options.title = title;
        if (this._titleEl) {
            this._titleEl.textContent = title ?? "";
        }
        return this;
    }

    /**
     * Set content.
     * 设置内容
     */
    setContent(content: string | HTMLElement): this {
        this.options.content = content;
        if (!this._contentEl) {
            return this;
        }

        this._contentEl.innerHTML = "";
        if (content instanceof HTMLElement) {
            this._contentEl.appendChild(content);
        } else {
            this._contentEl.innerHTML = content;
        }
        return this;
    }

    /**
     * Open InfoWindow (semantically equivalent to show).
     * 打开 InfoWindow（语义上等价于 show）
     * @param coordinate Optional geographic coordinate, use owner center / map center if not provided 可选地理坐标，不传则使用 owner 的中心 / 地图中心
     */
    open(coordinate?: LngLatLike): this {
        // Call base class show, create DOM, record coordinate, but keep hidden
        // 调用基类 show，创建 DOM、记录 coordinate，但保持隐藏
        super.show(coordinate);

        const anyThis = this as any;

        const tryShow = () => {
            // Feature / Map might have been removed or closed
            // 要素 / 地图可能已经被移除或关闭了
            if (!anyThis._dom || !anyThis._map || !anyThis._visible) {
                return;
            }
            // 2. Let _refreshDomPosition show directly this time (skip "first time not show" protection)
            // 2. 让 _refreshDomPosition 这一次就可以直接显示（跳过“第一次不显示”的保护）
            anyThis._positionedOnce = true;
            anyThis._refreshDomPosition();
        };

        // Prefer waiting for sceneRenderer's first frame update, then show (camera and render size are stable at this time)
        // 优先等 sceneRenderer 的第一帧 update，再显示（此时相机和渲染尺寸都稳定）
        const map: any = this.getMap();
        const sceneRenderer: any = map?.sceneRenderer;
        if (sceneRenderer && typeof sceneRenderer.addEventListener === "function") {
            const handler = () => {
                sceneRenderer.removeEventListener("update", handler);
                tryShow();
            };
            sceneRenderer.addEventListener("update", handler);
        } else {
            // Fallback: wait for next frame at least, avoid racing with current frame initialization state
            // 兜底：至少等到下一帧再显示，避免和当前帧的初始化状态抢时间
            requestAnimationFrame(tryShow);
        }

        return this;
    }

    /**
     * Close InfoWindow (semantically equivalent to hide).
     * 关闭 InfoWindow（语义上等价于 hide）
     */
    close(): this {
        return this.hide();
    }
}
