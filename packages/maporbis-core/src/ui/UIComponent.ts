import { Vector3 } from "three";
import { BaseMixin, EventMixin, type ClassOptions } from "../core/mixins";
import type { Map as TerraMap } from "../index";
import type { LngLatLike } from "../types";

/**
 * UI Component options.
 * UI 组件配置项
  * @category UI
 */
export type UIComponentOptions = ClassOptions & {
    /** 
     * DOM container class, can be string or string[].
     * DOM 容器 class，可为 string 或 string[] 
     */
    containerClass?: string | string[];
    /** 
     * X pixel offset (positive for right).
     * X 方向像素偏移（右为正） 
     */
    dx?: number;
    /** 
     * Y pixel offset (positive for down).
     * Y 方向像素偏移（下为正） 
     */
    dy?: number;
    /** 
     * Whether visible by default.
     * 是否默认可见 
     */
    visible?: boolean;
    /** 
     * Whether it is a global unique component on the same map (only one of the same kind is displayed).
     * 是否为同一张地图上的全局唯一组件（同类只显示一个） 
     */
    single?: boolean;
    /** 
     * DOM zIndex.
     * DOM zIndex 
     */
    zIndex?: number;
};

class EmptyBase {
    constructor(..._args: any[]) { }
}

/**
 * UI Component Base Class.
 * UI 组件基类
 * @description
 * Abstraction goals:
 * - Attach to Map or Feature (addTo)
 * - Internally manage DOM lifecycle (buildOn / remove)
 * - Position DOM to screen coordinates based on world coordinates + camera
 * - Update position when listening to map view changes (viewchange)
 * 
 * 抽象目标：
 * - 挂到 Map 或 Feature 上（addTo）
 * - 内部管理 DOM 生命周期（buildOn / remove）
 * - 根据世界坐标 + 相机，将 DOM 定位到屏幕坐标
 * - 监听地图视图变化（viewchange）时更新位置
  * @category UI
 */
export abstract class UIComponent extends EventMixin(
    BaseMixin<typeof EmptyBase, any>(EmptyBase)
) {
    /** 
     * Component options.
     * 组件配置 
     */
    declare options: UIComponentOptions;

    /** 
     * Owner object: Map or Feature.
     * 所属对象：Map 或 Feature 
     */
    protected _owner?: any;
    
    /** 
     * Map instance.
     * 所属地图实例 
     */
    protected _map?: TerraMap;
    
    /** 
     * Current world position.
     * 当前使用的世界坐标 
     */
    protected _worldPosition?: Vector3;
    
    /** 
     * Recorded coordinate if passed via show(coordinate).
     * 如果通过 show(coordinate) 传入了坐标，这里记录下来 
     */
    private _coordinate?: LngLatLike;
    
    /** 
     * Corresponding DOM element.
     * 对应的 DOM 元素 
     */
    protected _dom?: HTMLElement;
    
    /** 
     * Whether currently visible.
     * 当前是否可见 
     */
    protected _visible: boolean = false;

    /** 
     * Cache event handlers bound to Map for removal on off.
     * 绑定到 Map 的事件处理缓存，便于 off 时移除 
     */
    private _boundMapHandlers = new Map<string, (...args: any[]) => void>();

    /** 
     * SceneRenderer update event handler.
     * 绑定到 SceneRenderer 的 update 事件处理函数 
     */
    private _sceneRendererUpdateHandler?: (evt: any) => void;

    /** 
     * Whether position calculation has been done once (to avoid initial wrong position flicker).
     * 是否已经完成过一次位置计算（用于避免第一次错误位置闪一下） 
     */
    private _positionedOnce: boolean = false;

    /** 
     * Set of "single" components on the same map for mutual exclusion display.
     * 同一张地图上的“single”组件集合，用于互斥显示 
     */
    private static _singletons = new Set<UIComponent>();

    /**
     * @param options UI component options UI 组件配置
     */
    constructor(options: UIComponentOptions = {}) {
        super(options);
    }

    /**
     * Subclasses must implement: Build own DOM.
     * 子类必须实现：构建自身 DOM
     * @returns Created DOM element 创建的 DOM 元素
     */
    protected abstract buildOn(): HTMLElement;

    /**
     * Subclasses optional: For debugging and style distinction.
     * 子类可选：用于调试和样式区分
     * @returns Class name 类名
     */
    protected _getClassName(): string {
        return "UIComponent";
    }

    /**
     * Subclasses optional: Extra offset.
     * 子类可选：额外偏移
     * @returns {Object} Offset `{x, y}` 偏移量
     */
    protected getOffset(): { x: number; y: number } {
        return {
            x: this.options.dx ?? 0,
            y: this.options.dy ?? 0,
        };
    }

    /**
     * Lifecycle hook: Called on addTo.
     * 生命周期钩子：addTo 时调用
     */
    protected onAdd?(): void;

    /**
     * Lifecycle hook: Called on remove.
     * 生命周期钩子：remove 时调用
     */
    protected onRemove?(): void;

    /**
     * Lifecycle hook: Called when DOM is removed from container.
     * 生命周期钩子：DOM 从容器移除时调用
     */
    protected onDomRemove?(): void;

    /**
     * Add UIComponent to Map or Feature.
     * 将 UIComponent 添加到 Map 或 Feature 上
     * @param owner Map or Feature Map 或 Feature
     */
    addTo(owner: any): this {
        if (!owner) return this;

        this._owner = owner;
        // Convention: Feature has getMap, Map itself is map
        // 约定：Feature 有 getMap，Map 自身就是 map
        const map: TerraMap | null =
            typeof owner.getMap === "function" ? owner.getMap() : owner;

        if (!map) {
            return this;
        }

        this._map = map;

        // Bind map view change events
        // 绑定地图视图变化事件
        this._bindMapEvents(true);

        // Handle single mutual exclusion logic (singleton UI on the same Map)
        // 处理 single 互斥逻辑（同一张 Map 上的“单例” UI）
        if (this.options.single) {
            UIComponent._singletons.forEach((ui) => {
                if (ui !== this && ui.options.single && ui._map === map) {
                    ui.hide();
                }
            });
            UIComponent._singletons.add(this);
        }

        if (this.onAdd) {
            this.onAdd();
        }

        this.fire("add", { owner, map });

        return this;
    }

    /**
     * Remove UIComponent from owner Map / Feature.
     * 从所属 Map / Feature 移除 UIComponent
     */
    remove(): this {
        const map = this._map;

        // Hide and remove DOM first
        // 先隐藏并移除 DOM
        this.hideDom();

        // Unbind map events
        // 解绑地图事件
        this._bindMapEvents(false);

        if (this.options.single) {
            UIComponent._singletons.delete(this);
        }

        if (this.onRemove) {
            this.onRemove();
        }

        this.fire("remove", { owner: this._owner, map });

        this._owner = undefined;
        this._map = undefined;

        return this;
    }




    /**
     * Show UIComponent.
     * 显示 UIComponent
     * @param coordinate Geographic coordinate ([lng, lat, alt]), optional 地理坐标（[lng, lat, alt]），可选
     */
    show(coordinate?: LngLatLike): this {
        const map = this._map ?? (this._owner && typeof this._owner.getMap === "function"
            ? this._owner.getMap()
            : undefined);

        if (!map) {
            return this;
        }
        this._map = map;

        // Handle single mutual exclusion logic (singleton UI on the same Map)
        // 处理 single 互斥逻辑（针对已经 addTo 但再次 show 的情况）
        if (this.options.single) {
            UIComponent._singletons.forEach((ui) => {
                if (ui !== this && ui.options.single && ui._map === map && ui.isVisible()) {
                    ui.hide();
                }
            });
            UIComponent._singletons.add(this);
        }

        // Create DOM
        // 创建 DOM
        if (!this._dom) {
            const dom = this.buildOn();
            this._dom = dom;
            dom.style.position = "absolute";
            if (typeof this.options.zIndex === "number") {
                dom.style.zIndex = String(this.options.zIndex);
            }
            const container = map.getContainer();
            if (!container) {
                return this;
            }
            container.appendChild(dom);
        }

        // Record explicitly passed coordinate (if any)
        // 记录显式传入的坐标（如果有）
        this._coordinate = coordinate ? [...coordinate] as LngLatLike : undefined;

        // Mark as visible, but hide first, wait for InfoWindow to decide when to show
        // 标记为可见，但先隐藏，等 InfoWindow 自己决定真正显示时机
        this._visible = true;
        this._positionedOnce = false;
        if (this._dom) {
            this._dom.style.display = "none";
        }

        // Do not call _updatePosition actively here, position update is left to external (e.g. InfoWindow.open)
        // 此处不主动调用 _updatePosition，位置更新交给外部（比如 InfoWindow.open）

        this.fire("show", { owner: this._owner, map });

        return this;
    }



    /**
     * Hide UIComponent (keep DOM, do not unbind).
     * 隐藏 UIComponent（保留 DOM，不解绑）
     */
    hide(): this {
        this._visible = false;
        if (this._dom) {
            this._dom.style.display = "none";
        }
        // Clear explicit coordinate when hidden
        // 隐藏时清掉显式坐标
        this._coordinate = undefined;
        this.fire("hide", { owner: this._owner, map: this._map });
        return this;
    }
    /**
     * Remove DOM (called on remove).
     * 移除 DOM（remove 时调用）
     */
    hideDom(): this {
        if (this._dom && this._dom.parentElement) {
            this._dom.parentElement.removeChild(this._dom);
            if (this.onDomRemove) {
                this.onDomRemove();
            }
        }
        this._dom = undefined;
        this._visible = false;
        // Clear coordinate when DOM is removed
        // DOM 移除时也清掉坐标
        this._coordinate = undefined;
        return this;
    }

    /**
     * Get owner Map.
     * 获取所属 Map
     */
    getMap(): TerraMap | undefined {
        return this._map;
    }

    /**
     * Whether currently visible (show state).
     * 当前是否可见（show 状态）
     */
    isVisible(): boolean {
        return this._visible;
    }

    /**
     * Internal: Bind / Unbind map events.
     * 内部：绑定 / 解绑地图事件
     */
    private _bindMapEvents(on: boolean) {
        const map = this._map;
        if (!map) return;

        const mapAny = map as any;
        const type = on ? "on" : "off";

        const ensureHandler = (event: string, handler: (...args: any[]) => void) => {
            if (on) {
                this._boundMapHandlers.set(event, handler);
            } else {
                this._boundMapHandlers.delete(event);
            }
        };

        if (on) {
            // Map view change: drag, zoom, etc.
            // 地图视图变化：拖动、缩放等
            const handler = () => {
                if (this._visible) {
                    this._refreshDomPosition();
                }
            };
            mapAny[type]("viewchange", handler);
            ensureHandler("viewchange", handler);

            // In render loop: sceneRenderer triggers update every frame
            // 渲染循环中：sceneRenderer 每帧触发 update
            const sceneRenderer: any = (map as any).sceneRenderer;
            if (sceneRenderer && !this._sceneRendererUpdateHandler) {
                const vHandler = () => {
                    if (this._visible) {
                        this._refreshDomPosition();
                    }
                };
                this._sceneRendererUpdateHandler = vHandler;
                sceneRenderer.addEventListener("update", vHandler);
            }
        } else {
            // Unbind map events
            // 解绑 map 事件
            this._boundMapHandlers.forEach((handler, event) => {
                mapAny[type](event, handler);
            });
            this._boundMapHandlers.clear();

            // Unbind sceneRenderer.update
            // 解绑 sceneRenderer.update
            const sceneRenderer: any = (map as any).sceneRenderer;
            if (sceneRenderer && this._sceneRendererUpdateHandler) {
                sceneRenderer.removeEventListener("update", this._sceneRendererUpdateHandler);
                this._sceneRendererUpdateHandler = undefined;
            }
        }
    }


    /**
     * Internal: Derive world position from geographic coordinate / owner.
     * Ensures unified use of map.lngLatToWorld to keep altitude / center units consistent.
     * 
     * 内部：根据地理坐标 / owner 推导世界坐标
     * 保证统一走 map.lngLatToWorld，从而保持 altitude / center 单位统一
     */
    private _resolveWorldPosition(): Vector3 | undefined {
        const map = this._map;
        if (!map) return undefined;

        // If coordinate is explicitly passed via show(coordinate), use it preferentially
        // 如果通过 show(coordinate) 显式传入了坐标，优先使用它
        if (this._coordinate) {
            const [lng, lat, alt = 0] = this._coordinate as any;
            const v = new Vector3(lng, lat, alt);
            return map.lngLatToWorld(v);
        }

        const owner: any = this._owner;

        // If owner is Feature, derive from GeoJSON geometry preferentially (Point / MultiPoint is most stable)
        // owner 是 Feature 的情况，优先从 GeoJSON 几何推导（Point / MultiPoint 最稳定）
        if (owner && owner._geometry) {
            const g = owner._geometry;
            if (g && (g.type === "Point" || g.type === "MultiPoint")) {
                let coordArr: number[] | undefined;

                if (g.type === "Point") {
                    coordArr = g.coordinates as any;
                } else if (
                    g.type === "MultiPoint" &&
                    Array.isArray(g.coordinates) &&
                    g.coordinates.length > 0
                ) {
                    // MultiPoint: take the first point
                    // MultiPoint：取第一个点
                    coordArr = g.coordinates[0] as any;
                }

                if (coordArr && coordArr.length >= 2) {
                    const v = new Vector3(
                        coordArr[0],
                        coordArr[1],
                        (coordArr[2] ?? 0) as number
                    );
                    return map.lngLatToWorld(v);
                }
            }

            // Then consider Three geometry / internal position (avoid incorrect world coordinates during initialization)
            // 再考虑 Three 几何 / 内部位置（避免初始化阶段 world 坐标不对）
            if (owner._renderObject && typeof owner._renderObject.getWorldPosition === "function") {
                const world = new Vector3();
                owner._renderObject.getWorldPosition(world);
                if (!(world.x === 0 && world.y === 0 && world.z === 0)) {
                    return world;
                }
            }

            if (owner._worldLngLatLikes instanceof Vector3) {
                const pos = owner._worldLngLatLikes as Vector3;
                if (!(pos.x === 0 && pos.y === 0 && pos.z === 0)) {
                    return pos.clone();
                }
            }
        }

        // Non-Feature or fallback: owner has its own world position method (e.g. Map / other Object3D)
        // 非 Feature 或兜底：owner 自己有世界坐标方法（比如 Map / 其他 Object3D）
        if (owner && typeof owner.getWorldPosition === "function") {
            const world = new Vector3();
            owner.getWorldPosition(world);
            return world;
        }

        // Finally fallback to map center
        // 最后退化为地图中心
        return map.prjcenter?.clone?.() ?? undefined;
    }



    /**
     * Internal: Update DOM position based on world coordinates.
     * 内部：根据世界坐标更新 DOM 位置
     */
    protected _refreshDomPosition() {
        if (!this._dom || !this._map) return;

        // Derive world coordinates based on latest state every time (do not pass coordinate, use owner's current state)
        // 每次根据最新状态推导一次世界坐标（不传 coordinate，用 owner 当前状态）
        if (this._visible) {
            const world = this._resolveWorldPosition();
            if (!world) {
                this._dom.style.display = "none";
                return;
            }
            this._worldPosition = world;
        }

        if (!this._worldPosition) return;

        const sceneRenderer = this._map.sceneRenderer;
        const camera = sceneRenderer.camera;
        // const renderer = sceneRenderer.renderer;

        // Handle initial display or content update size measurement (solve offsetWidth/Height being 0 problem)
        // 处理初次显示或内容更新时的尺寸测量（解决 offsetWidth/Height 为 0 的问题）
        const isHidden = this._dom.style.display === "none";
        if (isHidden) {
            this._dom.style.visibility = "hidden";
            this._dom.style.display = "";
        }

        // Ensure camera matrix is up to date, avoid 1 frame delay
        // 确保相机矩阵是最新的，避免 1 帧延迟
        camera.updateMatrixWorld();
        const ndc = this._worldPosition.clone().project(camera);

        // Hide if not in frustum
        // 不在视锥内就隐藏
        if (
            ndc.x < -1.1 ||
            ndc.x > 1.1 ||
            ndc.y < -1.1 ||
            ndc.y > 1.1 ||
            ndc.z < -1 ||
            ndc.z > 1
        ) {
            this._dom.style.display = "none";
            if (isHidden) {
                this._dom.style.visibility = "";
            }
            return;
        }

        const x = (ndc.x * 0.5 + 0.5) * sceneRenderer.width;
        const y = (-ndc.y * 0.5 + 0.5) * sceneRenderer.height;

        const offset = this.getOffset();

        this._dom.style.left = `${x + offset.x}px`;
        this._dom.style.top = `${y + offset.y}px`;

        if (isHidden) {
            this._dom.style.visibility = "";
        }

        // Only update position for the first time, do not show, avoid "wrong position flicker"
        // 第一次只更新位置，不显示，避免「错误位置闪一下」
        if (!this._positionedOnce) {
            this._positionedOnce = true;
            this._dom.style.display = "none";
            return;
        }

        // From the second time, position is stable, then really show
        // 从第二次开始，位置已经稳定，再真正显示
        this._dom.style.display = "";
    }
}
