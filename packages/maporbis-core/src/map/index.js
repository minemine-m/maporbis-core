export * from "./utils";
import { Vector3, Raycaster, Vector2, Clock, Group } from "three";
import { SceneRenderer } from "../renderer";
import { requireParam, requireProp } from "../utils/validate";
import { BaseMixin, EventMixin } from "../core/mixins";
import { OverlayLayer } from "../layer/OverlayLayer";
import { isNullOrUndefined, formatDate } from "../utils";
import { LayerContainer } from "../layer/LayerContainer";
import { CanvasManager } from "../core/canvas";
import Handlerable from '../handler/Handlerable';
import { Feature } from '../feature/Feature';
import { CollisionEngine } from '../core/collision/CollisionEngine';
import { debounce } from 'lodash';
import { VectorTileRenderLayer } from "../layer/TileLayer/renderer/VectorTileRenderLayer";
import { registerDefaultLoaders } from '../loaders';
import { WebMercatorProjection as ProjMCT } from "../projection";
import { getLocalInfoFromWorld, getLocalInfoFromScreen } from "./utils";
/**
 * Create an empty base class (only used as mixin starting point).
 * 创建一个空基类（仅用于混入起点）
 */
class EmptyClass {
    constructor(..._args) { } // Allow receiving any arguments 允许接收任意参数
}
const options = {};
/**
 * Map main class, inheriting from EventMixin and BaseMixin.
 * 地图主类，继承自事件混入和基础混入
 * @category Map
 * @example
 * const map = new Map('map-container', {
 *   state: {
 *     center: [120, 30],
 *     zoom: 12
 *   },
 *   source: {
 *     baseLayers: [...]
 *   }
 * });
 */
export class Map extends Handlerable(EventMixin(BaseMixin(EmptyClass))) {
    /**
     * SceneRenderer instance.
     * 场景渲染器实例
     */
    sceneRenderer;
    /**
     * Map root object
     * 地图根对象
     */
    _rootGroup = new Group();
    /**
     * Map layers
     * 地图图层
     */
    _layers = new globalThis.Map();
    /**
     * Map projection
     * 地图投影
     */
    _mapProjection = new ProjMCT(0);
    /**
     * Update clock
     * 更新时钟
     */
    _animationClock = new Clock();
    /**
     * Whether to automatically update
     * 是否自动更新
     */
    autoUpdate = true;
    /**
     * Update interval (ms)
     * 更新间隔（毫秒）
     */
    updateInterval = 100;
    /**
     * Min zoom level
     * 最小缩放级别
     */
    minLevel = 2;
    /**
     * Max zoom level
     * 最大缩放级别
     */
    maxLevel = 19;
    /**
     * Get map projection.
     * 获取地图投影
     *
     * @returns Current map projection instance
     *          当前地图投影实例
     */
    getProjection() {
        return this._mapProjection;
    }
    /**
     * Set map projection.
     * 设置地图投影
     *
     * @param projection New map projection instance
     *                   新的地图投影实例
     * @returns Map instance
     *          地图实例
     */
    setProjection(projection) {
        this._mapProjection = projection;
        return this;
    }
    get projection() { return this._mapProjection; }
    get lon0() { return this.projection.centralMeridian; }
    /**
     * Convert geographic coordinate to map model coordinate
     * 地理坐标转换到地图模型坐标
     * @param lngLat Geographic coordinate (Long, Lat, Alt)
     * @returns Map model coordinate
     */
    lngLatToPoint(lngLat) {
        const pos = this.projection.forward(lngLat.x, lngLat.y);
        return new Vector3(pos.x, pos.y, lngLat.z);
    }
    /**
     * Convert geographic coordinate to world coordinate
     * 地理坐标转换到世界坐标
     * @param lngLat Geographic coordinate (Long, Lat, Alt)
     * @returns World coordinate
     */
    lngLatToWorld(lngLat) {
        return this._rootGroup.localToWorld(this.lngLatToPoint(lngLat));
    }
    /**
     * Convert map model coordinate to geographic coordinate
     * 地图模型坐标转换到地理坐标
     * @param point Map model coordinate
     * @returns Geographic coordinate (Long, Lat, Alt)
     */
    pointToLngLat(point) {
        const pos = this.projection.inverse(point.x, point.y);
        return new Vector3(pos.lon, pos.lat, point.z);
    }
    /**
     * Convert world coordinate to geographic coordinate
     * 世界坐标转换到地理坐标
     * @param worldPos World coordinate
     * @returns Geographic coordinate (Long, Lat, Alt)
     */
    worldToLngLat(worldPos) {
        return this.pointToLngLat(this._rootGroup.worldToLocal(worldPos.clone()));
    }
    /**
     * Query intersection info at geographic coordinate
     * 查询指定地理坐标的交互/地面信息
     * @param lngLat Geographic coordinate
     * @returns Intersection info
     */
    queryAtLngLat(lngLat) {
        const pointer = this.lngLatToWorld(lngLat);
        return getLocalInfoFromWorld(this, pointer);
    }
    /**
     * Query intersection info at world coordinate
     * 查询指定世界坐标的交互/地面信息
     * @param worldPos World coordinate
     * @returns Intersection info
     */
    queryAtWorld(worldPos) {
        return getLocalInfoFromWorld(this, worldPos);
    }
    /**
     * Query intersection info at screen pixel coordinate
     * 查询指定屏幕坐标的交互/地面信息
     * @param point Screen pixel coordinate
     * @returns Intersection info
     */
    queryAtPoint(point) {
        return getLocalInfoFromScreen(this.sceneRenderer.camera, this, point);
    }
    /**
     * Map center coordinates.

     * 地图中心点坐标
     */
    center;
    /**
     * Projected map center coordinates.
     * 投影后的地图中心点坐标
     */
    prjcenter;
    // Note: _layerContainer reserved for future use
    // private _layerContainer!: LayerContainer;
    /**
     * Event map table.
     * 事件映射表
     */
    _eventState = {
        load: { listened: false }, // Load event parameters 加载事件参数
    };
    /**
     * Canvas manager instance.
     * 画布管理器实例
     */
    _canvasMgr = new CanvasManager();
    /**
     * Collision engine instance.
     * 碰撞引擎实例
     */
    _collisionEngine;
    /**
     * Load hook function array.
     * 加载钩子函数数组
     */
    //@ts-ignore
    _onLoadHooks;
    // === Zoom related state (View level, decoupled from tile LOD) ===
    // === 缩放相关状态（视图级别，与瓦片 LOD 解耦） ===
    /**
     * Minimum/Maximum allowed zoom level for view (Configurable externally, only used for clipping logic).
     * 视图允许的最小/最大缩放级别（对外可配置，只用于裁剪逻辑）
     */
    _minZoom = 0;
    _maxZoom = 22;
    /**
     * Internal global zoom scale (Determines relation between zoom and distance, only for setZoom camera pushing).
     * 内部使用的全局 zoom 标尺（决定 zoom 与距离的关系，仅用于 setZoom 推相机）
     */
    _ZOOM_MIN_CONST = 0;
    _ZOOM_MAX_CONST = 22;
    /**
     * Nearest/Farthest allowed camera distance during zoom (Used for mapping).
     * 缩放时相机允许的最近/最远距离（用于映射）
     */
    _minZoomDistance = 500;
    _maxZoomDistance = 40000000;
    /**
     * Whether currently in zoom interaction.
     * 当前是否处于缩放交互中
     */
    _isZooming = false;
    /**
     * Start zoom value of current zoom operation.
     * 本次缩放起始 zoom 值
     */
    _zoomStartValue = 0;
    /**
     * Last recorded zoom (Used for control events).
     * 上一次记录的 zoom（用于控制器事件）
     */
    _lastZoomForControls = 0;
    /**
     * "Extra zoom levels" beyond data levels (Overzoom count).
     * 超出数据层级后的“额外 zoom 级数”（overzoom 计数）
     */
    _overZoom = 0;
    /**
     * Record camera distance to target in previous frame, used to determine zoom in/out direction.
     * 记录上一帧相机到目标点的距离，用于判断放大/缩小方向
     */
    _lastCameraDistance = 0;
    /**
     * Model features collection for animation updates (Pro feature placeholder).
     * 模型要素集合，用于动画更新（Pro 功能占位）
     */
    _modelFeatures = [];
    /**
     * Create map instance.
     * 创建地图实例
     *
     * @param domContainer Map container element or element ID
     *                  地图容器元素或元素ID
     * @param config Map configuration options
     *                地图配置选项
     */
    constructor(container, options) {
        // super();
        requireParam(container, "container", "Map container element must be specified");
        requireProp(options, 'state');
        requireProp(options.state, 'center');
        // Default options
        // 默认配置
        const defaultOptions = {
            renderer: {
                antialias: true,
                stencil: true,
                logarithmicDepthBuffer: true,
            },
            camera: {},
            interaction: {},
            source: {},
        };
        // Merge options
        // 合并配置
        const opts = {
            ...options,
            renderer: { ...defaultOptions.renderer, ...options.renderer },
            camera: { ...defaultOptions.camera, ...options.camera },
            interaction: { ...defaultOptions.interaction, ...options.interaction },
            source: { ...defaultOptions.source, ...options.source },
        };
        super(opts);
        this.initMap(opts.source ?? {});
        // Register default tile loaders
        registerDefaultLoaders();
        this.center = this.options.state.center;
        const RendererClass = opts.rendererClass ?? SceneRenderer;
        this.sceneRenderer = new RendererClass(container, { ...opts.renderer, map: this });
        // Default enable shadow
        // 默认开启阴影
        this._rootGroup.receiveShadow = true;
        this._rootGroup.up.set(0, 0, 1);
        this._rootGroup.rotation.x = -Math.PI / 2;
        this.sceneRenderer.scene.add(this._rootGroup);
        // Update default ground position now that rootGroup transform is finalized
        // 更新默认地面位置，此时 rootGroup 变换已完成
        this.sceneRenderer._updateDefaultGroundPosition();
        // Map center (Target point) world coordinates
        // 地图中心（目标点）世界坐标
        const centerWorldPos = this.lngLatToWorld(new Vector3(this.center[0], this.center[1], 0));
        this.prjcenter = centerWorldPos;
        // Register update loop
        // 注册更新循环
        this.sceneRenderer.on('update', () => {
            this.render(this.sceneRenderer.camera);
        });
        // ========= Use camera options for pitch/bearing, initialize camera =========
        // ========= 使用 camera 配置的 pitch/bearing，初始化相机 =========
        const cameraOpts = this.options.camera ?? {};
        this.sceneRenderer.easeTo({
            center: [this.center[0], this.center[1]],
            distance: typeof this.center[2] === 'number' ? this.center[2] : undefined,
            // Use pitch/bearing in degrees from camera options
            pitch: typeof cameraOpts.pitch === 'number' ? cameraOpts.pitch : undefined,
            bearing: typeof cameraOpts.bearing === 'number' ? cameraOpts.bearing : undefined,
            duration: 0,
            curvePath: false
        });
        // const controls = this.sceneRenderer.controls as any;
        this._minZoomDistance = this.sceneRenderer.controls.minDistance;
        this._maxZoomDistance = this.sceneRenderer.controls.maxDistance;
        const initialDistance = this._getCameraDistance();
        this._lastCameraDistance = initialDistance;
        // this.sceneRenderer.camera.position.set(this.centerWorldPos.x, 100, this.centerWorldPos.z);
        this._layerGroup = new LayerContainer();
        this.sceneRenderer.scene.add(this._layerGroup);
        // === Initialize zoom mapping: Based on control distance limits ===
        // === 初始化缩放映射：基于控制器的距离限制 ===
        const controls = this.sceneRenderer.controls;
        this._minZoomDistance = typeof controls?.minDistance === 'number' ? controls.minDistance : 500;
        this._maxZoomDistance = typeof controls?.maxDistance === 'number' ? controls.maxDistance : 80000;
        // Default view zoom range:
        // By default, use "data level" as zoom range,
        // then clamp between global scale [_ZOOM_MIN_CONST, _ZOOM_MAX_CONST].
        // 视图 zoom 的默认范围：
        // 默认情况下，用“数据层级”作为 zoom 范围，
        // 再夹在全局标尺 [_ZOOM_MIN_CONST, _ZOOM_MAX_CONST] 之间。
        // 视图 zoom 的默认范围
        const baseLayer = this.getLayers()
            .find((layer) => layer.isBaseLayer === true);
        const dataMin = baseLayer?.minLevel ?? this.minLevel;
        // Min zoom uses data minLevel, Max zoom uses global theoretical limit (e.g. 22)
        // 最小 zoom 用数据的 minLevel，最大 zoom 用全局理论上限（比如 22）
        this._minZoom = Math.max(this._ZOOM_MIN_CONST, Math.min(this._ZOOM_MAX_CONST, dataMin));
        this._maxZoom = this._ZOOM_MAX_CONST;
        // Initialize "last zoom" to current tile level
        // 初始化“上一次 zoom”为当前瓦片级别
        const initialTileZoom = this.getZoom();
        this._lastZoomForControls = initialTileZoom;
        this._zoomStartValue = initialTileZoom;
        // Initialize collision engine
        // 初始化碰撞引擎
        this._collisionEngine = new CollisionEngine(this.sceneRenderer.renderer, {
            padding: 8,
            updateInterval: 16, // ~60fps
            animationDuration: 200,
            maxFeaturesPerFrame: 20000,
            strategies: {
                priority: true,
                grouping: true,
                proximity: true
            }
        });
        // Listen to control changes: update zoom, and drive collision and zoom events
        // 监听控制器变化：更新 zoom，并驱动碰撞与缩放事件
        this.on('viewchange', debounce((evt) => {
            // Safety check: if object destroyed, return directly
            // 安全检查：如果对象已销毁，直接返回
            if (!this._rootGroup || !this._collisionEngine) {
                return;
            }
            // Current real tile level
            // 当前真实瓦片层级
            const dataZoom = this.getTileZoom();
            // Data max level
            // 数据最大层级
            const baseLayer = this.getLayers()
                .find((layer) => layer.isBaseLayer === true);
            const maxDataZoom = baseLayer?.maxLevel ?? this.maxLevel;
            // Current camera distance, used to determine zoom in/out direction
            // 当前相机距离，用于判断放大/缩小方向
            const distance = this._getCameraDistance();
            const deltaDist = distance - this._lastCameraDistance;
            this._lastCameraDistance = distance;
            // Update overZoom based on distance change
            // 根据距离变化更新 overZoom
            const { max: maxZoomFromView } = this._getViewZoomRange();
            // overzoom limit only depends on view capability
            // overzoom 上限只看视图能力
            const maxExtra = Math.max(0, maxZoomFromView - maxDataZoom);
            if (dataZoom < maxDataZoom) {
                // Data not reached top: disallow overzoom, force clear
                // 数据没到顶：不允许 overzoom，强制清零
                this._overZoom = 0;
            }
            else {
                // Data reached top: accumulate/reduce overzoom based on distance direction
                // 数据到顶：根据距离方向累加/减少 overzoom
                const eps = 1e-3;
                if (deltaDist < -eps) {
                    // Distance decreases => Zoom In
                    // 距离变小 => 放大
                    this._overZoom = Math.min(this._overZoom + 1, maxExtra);
                }
                else if (deltaDist > eps) {
                    // Distance increases => Zoom Out
                    // 距离变大 => 缩小
                    this._overZoom = Math.max(this._overZoom - 1, 0);
                }
                // Distance almost unchanged => View zoom static, don't change overzoom
                // 距离几乎不变 => 视图缩放不动，不改 overzoom
            }
            // Calculate current composite zoom (Data + Overzoom)
            // 计算当前综合 zoom（数据 + overzoom）
            const newZoom = this.getZoom();
            const zoomChanged = Math.abs(newZoom - this._lastZoomForControls) > 1e-3;
            if (zoomChanged) {
                if (!this._isZooming) {
                    this._isZooming = true;
                    this._zoomStartValue = this._lastZoomForControls;
                    this.fire('zoomstart', {
                        from: this._zoomStartValue,
                        to: newZoom
                    });
                }
                else {
                    this.fire('zoom', {
                        from: this._zoomStartValue,
                        to: newZoom
                    });
                }
                this._lastZoomForControls = newZoom;
            }
            this._collisionEngine.update(evt.camera);
        }, 10, {
            leading: false,
            trailing: true
        }));
        // When control interaction ends, if actual zoom happened, trigger zoomend
        // 控制器交互结束时，如果本次确实有缩放，则触发 zoomend
        this.on('moveend', () => {
            if (!this._isZooming)
                return;
            this._isZooming = false;
            this.fire('zoomend', {
                from: this._zoomStartValue,
                to: this.getZoom() // View zoom at end 结束时的视图 zoom
            });
        });
        this._callOnLoadHooks();
        // Update default ground visibility (now that sceneRenderer is initialized)
        // 更新默认地面可见性（此时 sceneRenderer 已初始化）
        this._updateDefaultGroundVisibility();
        // Register DOM events
        // 注册 DOM 事件
        // this._registerDomEvents();
    }
    /**
     * Add hook function after load completion.
     * 添加加载完成后的钩子函数
     *
     * @param fn Function name or function
     *           函数名或函数
     * @param args Additional arguments
     *             附加参数
     * @returns Map class
     *          地图类
     */
    static addOnLoadHook(fn, ...args) {
        const onload = typeof fn === 'function'
            ? fn
            : function () {
                this[fn].apply(this, args);
            };
        const proto = this.prototype;
        proto._onLoadHooks = proto._onLoadHooks || [];
        proto._onLoadHooks.push(onload);
        return this;
    }
    /**
     * Internal method: Call all load hook functions.
     * 内部方法:调用所有加载钩子函数
     */
    _callOnLoadHooks() {
        const proto = Map.prototype;
        if (!proto._onLoadHooks) {
            return;
        }
        for (let i = 0, l = proto._onLoadHooks.length; i < l; i++) {
            proto._onLoadHooks[i].call(this);
        }
    }
    // ======= Zoom related public APIs =======
    // ======= 缩放相关对外 API =======
    /**
     * Get current "View Zoom Level".
     * 获取当前“视图缩放级别”
     *
     * @description
     * Mapped to fixed scale [0, 22] based on camera distance.
     * This value can exceed data source maxLevel (e.g., 18), used for UI / Styling / Interaction.
     * 按相机距离映射到固定标尺 [0, 22]。
     * 这个值可以超过数据源的 maxLevel（比如 18），用于 UI / 样式 / 交互。
     */
    getZoom() {
        // Current real tile level
        // 当前真实瓦片层级
        const dataZoom = this.getTileZoom();
        // Base map configured max data level
        // 底图配置的最大数据级别
        const baseLayer = this.getLayers()
            .find((layer) => layer.isBaseLayer === true);
        const maxDataZoom = baseLayer?.maxLevel ?? this.maxLevel;
        // Data not reached limit: use data level directly
        // 数据还没到上限：直接用数据层级
        if (dataZoom < maxDataZoom) {
            return dataZoom;
        }
        // Data reached limit: add overzoom
        // 数据到上限：叠加 overzoom
        return maxDataZoom + this._overZoom;
    }
    /**
    * Get current "Data Zoom Level" (Tile z).
    * 获取当前“数据缩放级别”（瓦片 z）
    *
    * @description
    * Actual z calculated from TileMap base layer tile tree.
    * Max value limited by data source and TileLayer.maxLevel, e.g., data only goes up to 18.
    * 从 TileMap 的底图瓦片树中统计出来的实际 z。
    * 最大值受数据源和 TileLayer.maxLevel 限制，例如数据只到 18。
     */
    getTileZoom() {
        let current = this.minLevel;
        // 找到底图图层（isBaseLayer === true）
        const baseLayer = this.getLayers()
            .find((layer) => layer.isBaseLayer === true);
        if (!baseLayer || !baseLayer._rootTile) {
            return current;
        }
        const rootTile = baseLayer._rootTile;
        rootTile.traverseVisible((tile) => {
            if (tile.showing && tile.inFrustum) {
                current = Math.max(current, tile.z);
            }
        });
        return current;
    }
    /**
     * Get view minimum zoom level.
     * 获取视图最小缩放级别
     */
    getMinZoom() {
        return this._minZoom;
    }
    /**
     * Get view maximum zoom level.
     * 获取视图最大缩放级别
     */
    getMaxZoom() {
        return this._maxZoom;
    }
    /**
    * Set view zoom range.
    * 设置视图缩放范围
    *
    * @param minZoom Minimum zoom level
    *                最小缩放级别
    * @param maxZoom Maximum zoom level
    *                最大缩放级别
    */
    setZoomBounds(minZoom, maxZoom) {
        if (minZoom > maxZoom) {
            const tmp = minZoom;
            minZoom = maxZoom;
            maxZoom = tmp;
        }
        this._minZoom = minZoom;
        this._maxZoom = maxZoom;
        // Sync limit control physical zoom distance (Still used for setZoom camera pushing)
        // 同步限制控制器的物理缩放距离（仍然用于 setZoom 推相机）
        const controls = this.sceneRenderer.controls;
        if (controls) {
            const minDist = this._computeDistanceFromZoom(this._maxZoom);
            const maxDist = this._computeDistanceFromZoom(this._minZoom);
            controls.minDistance = minDist;
            controls.maxDistance = maxDist;
        }
        return this;
    }
    /**
     * Set minimum zoom level.
     * 设置最小缩放级别
     */
    setMinZoom(minZoom) {
        return this.setZoomBounds(minZoom, this._maxZoom);
    }
    /**
     * Set maximum zoom level.
     * 设置最大缩放级别
     */
    setMaxZoom(maxZoom) {
        return this.setZoomBounds(this._minZoom, maxZoom);
    }
    /**
     * Set zoom level.
     * 设置缩放级别
     *
     * @param zoom Target zoom level
     *             目标缩放级别
     * @returns Map instance
     *          地图实例
     */
    setZoom(zoom) {
        const minZoom = this.getMinZoom();
        const maxZoom = this.getMaxZoom();
        const targetZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        const prevZoom = this.getZoom(); // Previous view zoom 之前的视图 zoom
        const distance = this._computeDistanceFromZoom(targetZoom);
        const controls = this.sceneRenderer.controls;
        const target = controls?.target ?? this.prjcenter;
        const camera = this.sceneRenderer.camera;
        // Push/Pull camera along current view direction
        // 沿当前视线方向推拉相机
        const dir = camera.position.clone().sub(target).normalize();
        camera.position.copy(target).addScaledVector(dir, distance);
        camera.updateProjectionMatrix();
        // Notify control update (Internal emits change event)
        // 通知控制器更新（内部会发出 change 事件）
        if (typeof controls?.update === 'function') {
            controls.update();
        }
        // Record "Target View Zoom", used to check change in next interaction
        // 记录“目标视图 zoom”，下一次交互用来判断变化
        this._lastZoomForControls = targetZoom;
        // Programmatic set zoom, emit zoomend event directly (View Zoom)
        // 编程式设置 zoom，直接发一个 zoomend 事件（视图 zoom）
        this.fire('zoomend', {
            from: prevZoom,
            to: this.getZoom()
        });
        return this;
    }
    /**
     * Zoom in by specified levels.
     * 放大指定级数
     *
     * @param delta Zoom in levels, default 1
     *              放大级数，默认 1
     */
    zoomIn(delta = 1) {
        return this.setZoom(this.getZoom() + delta);
    }
    /**
     * Zoom out by specified levels.
     * 缩小指定级数
     *
     * @param delta Zoom out levels, default 1
     *              缩小级数，默认 1
     */
    zoomOut(delta = 1) {
        return this.setZoom(this.getZoom() - delta);
    }
    /**
     * Get current camera pitch angle in degrees.
     * 获取当前相机俯仰角（度）
     *
     * @returns Pitch angle in degrees (0 = looking straight down, 90 = horizontal)
     *          俯仰角（度，0为垂直向下看，90为水平）
     */
    getPitch() {
        const controls = this.sceneRenderer.controls;
        if (controls && typeof controls.getPolarAngle === 'function') {
            const polarAngleRad = controls.getPolarAngle();
            return (polarAngleRad * 180) / Math.PI;
        }
        return 0;
    }
    /**
     * Set camera pitch angle in degrees.
     * 设置相机俯仰角（度）
     *
     * @param pitch Pitch angle in degrees (0 = looking straight down, 90 = horizontal)
     *              俯仰角（度，0为垂直向下看，90为水平）
     * @returns Map instance
     *          地图实例
     */
    setPitch(pitch) {
        this.sceneRenderer.easeTo({
            center: this.getCenter(),
            distance: this._getCameraDistance(),
            pitch: pitch,
            bearing: this.getBearing(),
            duration: 0,
            curvePath: false
        });
        return this;
    }
    /**
     * Get current camera bearing angle in degrees.
     * 获取当前相机方位角（度）
     *
     * @returns Bearing angle in degrees (0 = north, 90 = east)
     *          方位角（度，0为正北，90为正东）
     */
    getBearing() {
        const controls = this.sceneRenderer.controls;
        if (controls && typeof controls.getAzimuthalAngle === 'function') {
            const azimuthalAngleRad = controls.getAzimuthalAngle();
            return (azimuthalAngleRad * 180) / Math.PI;
        }
        return 0;
    }
    /**
     * Set camera bearing angle in degrees.
     * 设置相机方位角（度）
     *
     * @param bearing Bearing angle in degrees (0 = north, 90 = east)
     *                方位角（度，0为正北，90为正东）
     * @returns Map instance
     *          地图实例
     */
    setBearing(bearing) {
        this.sceneRenderer.easeTo({
            center: this.getCenter(),
            distance: this._getCameraDistance(),
            pitch: this.getPitch(),
            bearing: bearing,
            duration: 0,
            curvePath: false
        });
        return this;
    }
    /**
     * Get minimum camera distance.
     * 获取最小相机距离
     *
     * @returns Minimum camera distance
     *          最小相机距离
     */
    getMinDistance() {
        const controls = this.sceneRenderer.controls;
        return typeof controls?.minDistance === 'number'
            ? controls.minDistance
            : this._minZoomDistance;
    }
    /**
     * Set minimum camera distance.
     * 设置最小相机距离
     *
     * @param minDistance Minimum camera distance
     *                    最小相机距离
     * @returns Map instance
     *          地图实例
     */
    setMinDistance(minDistance) {
        const controls = this.sceneRenderer.controls;
        if (controls) {
            controls.minDistance = minDistance;
            this._minZoomDistance = minDistance;
        }
        return this;
    }
    /**
     * Get maximum camera distance.
     * 获取最大相机距离
     *
     * @returns Maximum camera distance
     *          最大相机距离
     */
    getMaxDistance() {
        const controls = this.sceneRenderer.controls;
        return typeof controls?.maxDistance === 'number'
            ? controls.maxDistance
            : this._maxZoomDistance;
    }
    /**
     * Set maximum camera distance.
     * 设置最大相机距离
     *
     * @param maxDistance Maximum camera distance
     *                    最大相机距离
     * @returns Map instance
     *          地图实例
     */
    setMaxDistance(maxDistance) {
        const controls = this.sceneRenderer.controls;
        if (controls) {
            controls.maxDistance = maxDistance;
            this._maxZoomDistance = maxDistance;
        }
        return this;
    }
    /**
     * Inverse calculate camera distance to target from view zoom level.
     * 根据视图缩放级别反推相机到目标点的距离
     */
    _computeDistanceFromZoom(zoom) {
        const minZoom = this._ZOOM_MIN_CONST;
        const maxZoom = this._ZOOM_MAX_CONST;
        const minDist = this._minZoomDistance;
        const maxDist = this._maxZoomDistance;
        // Defense: Fallback to linear mapping if config is invalid
        // 防御：配置异常时退回线性映射
        if (minDist <= 0 || minDist >= maxDist) {
            const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
            const t = (maxZoom - clampedZoom) / (maxZoom - minZoom); // 0~1
            return minDist + t * (maxDist - minDist);
        }
        // Exponential mapping forward formula:
        // distance = maxDist * (minDist / maxDist) ^ t
        // t ∈ [0,1], obtained by linear interpolation of zoom
        // 指数映射的正向公式：
        // distance = maxDist * (minDist / maxDist) ^ t
        // t ∈ [0,1]，由 zoom 在线性插值得到
        const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        const t = (clampedZoom - minZoom) / (maxZoom - minZoom); // 0~1
        const ratio = minDist / maxDist; // < 1
        const distance = maxDist * Math.pow(ratio, t);
        return distance;
    }
    /**
     * Initialize map.
     * 初始化地图
     */
    initMap(source) {
        this.minLevel = source.minLevel ?? 2;
        this.maxLevel = source.maxLevel ?? 19;
        if (source.baseLayers?.length) {
            for (const layer of source.baseLayers) {
                layer.isBaseLayer = true;
                this.addTileLayer(layer);
            }
        }
        else {
            // No base layers provided, show default ground plane
            // 没有提供底图图层，显示默认地面
            this._updateDefaultGroundVisibility();
        }
        setTimeout(() => {
            const eventData = {
                timestamp: formatDate(),
                target: this
            };
            this._eventState["load"] = {
                listened: true
            };
            this.fire("load", eventData);
        }, 0);
    }
    /**
     * Update default ground plane visibility based on tile layers.
     * 根据瓦片图层更新默认地面可见性
     *
     * @description
     * Shows the default ground plane when no tile layers are present,
     * hides it when at least one tile layer exists.
     * 当没有瓦片图层时显示默认地面，当存在至少一个瓦片图层时隐藏。
     *
     * @internal
     */
    _updateDefaultGroundVisibility() {
        // Guard: sceneRenderer may not be initialized yet during constructor
        // 守卫：在构造函数期间 sceneRenderer 可能尚未初始化
        if (!this.sceneRenderer) {
            return;
        }
        const hasTileLayers = this._layers.size > 0;
        if (hasTileLayers) {
            this.sceneRenderer.hideDefaultGround();
        }
        else {
            this.sceneRenderer.showDefaultGround();
        }
    }
    /**
     * Show or hide the default ground plane manually.
     * 手动显示或隐藏默认地面
     *
     * @param visible - Whether to show the ground plane. 是否显示地面
     * @returns Current map instance. 当前地图实例
     */
    setGroundVisible(visible) {
        if (visible) {
            this.sceneRenderer.showDefaultGround();
        }
        else {
            this.sceneRenderer.hideDefaultGround();
        }
        return this;
    }
    /**
     * Check if the default ground plane is visible.
     * 检查默认地面是否可见
     *
     * @returns Whether the ground is visible. 地面是否可见
     */
    isGroundVisible() {
        return this.sceneRenderer.isDefaultGroundVisible();
    }
    /**
     * Update map and layers.
     * 更新地图和图层
     */
    render(camera) {
        if (!this.autoUpdate)
            return;
        const elapseTime = this._animationClock.getElapsedTime();
        if (elapseTime > this.updateInterval / 1000) {
            // console.log(`Map update loop. Layers count: ${this._layers.size}`);
            // Update all layers
            this._layers.forEach(layer => {
                // console.log(`Updating layer ${layer.getId()}, enabled: ${layer.enabled}, visible: ${layer.visible}`);
                if (layer.enabled && layer.visible) {
                    layer.update(camera);
                }
            });
            // Update model animations
            this._updateModelAnimations(elapseTime);
            this._animationClock.start();
        }
    }
    /**
     * Update all registered model animations.
     * 更新所有已注册的模型动画
     *
     * @param deltaTime Delta time in seconds
     *                  增量时间（秒）
     * @private
     */
    _updateModelAnimations(deltaTime) {
        for (const model of this._modelFeatures) {
            if (model.visible) {
                model.update(deltaTime);
            }
        }
    }
    /**
     * Add layer(s) to the map.
     * 添加图层到地图
     *
     * @param layerOrLayers Layer object or array of layer objects
     *               图层对象或图层对象数组
     * @param otherLayers Other layer objects
     *                    其他图层对象
     * @returns Current map instance
     *          当前地图实例
     */
    addLayer(layerOrLayers, ...otherLayers) {
        if (!layerOrLayers) {
            return this;
        }
        if (!Array.isArray(layerOrLayers)) {
            layerOrLayers = [layerOrLayers];
        }
        if (otherLayers?.length) {
            layerOrLayers = layerOrLayers.concat(otherLayers);
        }
        if (otherLayers?.length) {
            layerOrLayers = layerOrLayers.concat(otherLayers);
        }
        for (let i = 0, len = layerOrLayers.length; i < len; i++) {
            const layer = layerOrLayers[i];
            const id = layer.getId();
            if (isNullOrUndefined(id)) {
                throw new Error('Invalid id for the layer: ' + id);
            }
            if (layer.isTileLayer) {
                // Tile Layer: Add to scene + logic management
                // 瓦片图层：添加到场景 + 逻辑管理
                this.addTileLayer(layer);
            }
            else {
                // Regular Layer: Add to scene only
                // 普通图层：只添加到场景
                this.addRegularLayer(layer);
            }
        }
        return this;
    }
    /**
    * Remove layer.
    * 移除图层
    */
    removeLayer(id) {
        // Check if it is TileLayer
        // 先看是不是 TileLayer
        const tileLayer = this._layers.get(id);
        if (tileLayer) {
            // Remove tile layer from map
            // 从地图中移除瓦片图层
            this._layers.delete(id);
            this._rootGroup.remove(tileLayer);
            // Update ground visibility after tile layer removal
            // 移除瓦片图层后更新地面可见性
            this._updateDefaultGroundVisibility();
            // console.log(`✅ Tile layer removed from manager 瓦片图层从管理器移除: ${id}`);
            return true;
        }
        // Otherwise treat as regular layer (OverlayLayer / Other 3D layers)
        // 否则按普通图层处理（OverlayLayer / 其他三维图层）
        const layer = this._layerGroup.getLayerById(id);
        if (!layer) {
            console.warn(`⚠️ Layer does not exist 图层不存在: ${id}`);
            return false;
        }
        this._layerGroup.remove(layer);
        // console.log(`✅ Layer removed from scene 图层从场景移除: ${id}`);
        // Special handling: OverlayLayer collision
        // 特殊处理：OverlayLayer 的碰撞
        if (layer instanceof OverlayLayer && layer?._collision) {
            // this.collisionEngine.unregisterLayer(id);
        }
        // If layer.dispose() needs to be called in future, call it here
        // 这里如果以后要加 layer.dispose() 也可以在此调用
        // this.disposeLayer(layer);
        return true;
    }
    /**
     * Add regular layer (Add to scene only).
     * 添加普通图层（只添加到场景）
     */
    addRegularLayer(layer) {
        // const id = layer.getId();
        // Add to scene container only
        // 只添加到场景容器
        this._layerGroup.add(layer);
        layer._bindMap(this);
        // Special handling for OverlayLayer
        // OverlayLayer 的特殊处理
        if (layer instanceof OverlayLayer && layer?._collision) {
            this._collisionEngine.registerLayer(layer);
            layer.setCollisionEngine(this._collisionEngine);
        }
        // console.log(`📁 Regular layer added to scene 普通图层已添加到场景: ${id}`);
    }
    // addTileLayer(layer: ITileLayer) {   
    //     this.tileLayerManager.addLayer(layer);
    // }
    /**
    * Add tile layer.
    * 添加瓦片图层
    */
    addTileLayer(layer) {
        this._layers.set(layer.getId(), layer);
        this._rootGroup.add(layer);
        layer._bindMap(this);
        // Hide default ground when tile layer is added
        // 添加瓦片图层时隐藏默认地面
        this._updateDefaultGroundVisibility();
        return this;
    }
    /**
     * Clear all layers.
     * 清空所有图层
     *
     * @returns Layer container instance
     *          图层容器实例
     */
    clearLayers() {
        this._layerGroup.clear();
        this._layers.forEach(layer => {
            this._rootGroup.remove(layer);
        });
        this._layers.clear();
        // Show default ground after clearing all layers
        // 清空所有图层后显示默认地面
        this._updateDefaultGroundVisibility();
        return this;
    }
    /**
     * Get all layers.
     * 获取所有图层
     *
     * @returns Array of layers
     *          图层数组
     */
    getLayers() {
        // Regular layers in scene (Exclude internal VectorTileRenderLayer)
        // 场景中的普通图层（排除内部使用的 VectorTileRenderLayer）
        const sceneLayers = this._layerGroup
            .getLayers()
            .filter((layer) => !(layer instanceof VectorTileRenderLayer));
        // Tile layers in Map
        // Map 中的瓦片图层
        const tileLayers = Array.from(this._layers.values());
        return [...sceneLayers, ...tileLayers];
    }
    /**
     * Get layer by ID.
     * 根据ID获取图层
     *
     * @param id Layer ID
     *           图层ID
     * @returns Layer instance or undefined
     *          图层实例或undefined
     */
    getLayer(id) {
        // Check TileLayers first
        if (this._layers.has(id)) {
            return this._layers.get(id);
        }
        const layer = this._layerGroup.getLayerById(id);
        if (layer) {
            // Do not expose VectorTileRenderLayer externally
            // 对外不暴露 VectorTileRenderLayer
            if (layer instanceof VectorTileRenderLayer) {
                return undefined;
            }
            return layer;
        }
        return undefined;
    }
    /**
     * Get canvas.
     * 获取画布
     *
     * @param width Canvas width
     *              画布宽度
     * @param height Canvas height
     *               画布高度
     * @param keySuffix Key suffix
     *                  键名后缀
     * @returns Canvas instance
     *          画布实例
     */
    _getCanvas(width = 40, height = 30, keySuffix) {
        return this._canvasMgr.getCanvas(width, height, 1, keySuffix);
    }
    /**
     * Get map container.
     * 获取地图容器
     *
     * @returns Map container instance
     *          地图容器实例
     */
    getContainer() {
        return this.sceneRenderer.container;
    }
    /**
     * Get renderer.
     * 获取渲染器
     *
     * @returns Renderer instance
     *          渲染器实例
     */
    getRenderer() {
        return this.sceneRenderer.renderer;
    }
    /**
     * Get camera.
     * 获取相机
     *
     * @returns Camera instance
     *          相机实例
     */
    getCamera() {
        return this.sceneRenderer.camera;
    }
    /**
     * Find all Features at a specific position.
     * 找出某位置的所有Feature
     */
    _queryFeaturesAt(position) {
        const map = this;
        const renderer = map.getRenderer();
        const camera = map.getCamera();
        // Critical step: Convert element relative coordinates to NDC
        // 关键步骤：将元素相对坐标转换为NDC
        const rect = renderer.domElement.getBoundingClientRect();
        const x = (position.x / rect.width) * 2 - 1;
        const y = -(position.y / rect.height) * 2 + 1;
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const layers = map.getLayers().filter(layer => !layer?.isSceneLayer && layer?.visible === true);
        // console.log(layers, 'layers')
        // const interactableFeatures = map.getInteractableFeatures();
        const intersects = raycaster.intersectObjects(layers, true);
        // Extract Feature from hit objects, ignore non-Feature objects like tile
        // 只从命中的对象中提取 Feature，忽略 tile 等非 Feature 对象
        const featureHits = intersects
            .map(intersect => {
            let obj = intersect.object;
            let feature = null;
            // Traverse up to find nearest Feature
            // 向上遍历父节点，直到找到最近的 Feature
            while (obj) {
                if (obj instanceof Feature) {
                    feature = obj;
                    // console.log(feature, 'feature ------------------- ')
                    break;
                }
                obj = obj.parent;
            }
            if (!feature) {
                // Feature not found, hit tile or other auxiliary objects, discard
                // 没有找到 Feature，说明命中的是 tile 或其他辅助对象，丢弃
                return null;
            }
            // Check Feature visibility
            // 检查 Feature 的 visible 属性
            if (feature.visible === false) {
                return null;
            }
            return {
                feature,
                distance: intersect.distance,
                object: intersect.object
            };
        })
            .filter((hit) => !!hit);
        // Return empty array if no Feature hit
        // 如果没有任何 Feature 被命中，返回空数组
        if (!featureHits.length) {
            return [];
        }
        // Sort by distance from near to far
        // 按距离从近到远排序
        return featureHits.sort((a, b) => a.distance - b.distance);
    }
    /**
     * Get current map center point (Longitude, Latitude).
     * 获取当前地图中心点（经纬度）
     *
     * @returns Coordinate [lng, lat, height]
     */
    getCenter() {
        // controls.target always points to world coordinates of current view center
        // controls.target 始终指向当前视图中心的世界坐标
        const worldCenter = this.sceneRenderer.controls.target.clone();
        const geo = this.worldToLngLat(worldCenter); // Vector3(lng, lat, z)
        return [geo.x, geo.y, geo.z];
    }
    /**
     * Get event position (Screen coordinates).
     * 获取事件位置（屏幕坐标）
     */
    _getPointerPosition(domEvent) {
        let clientX, clientY;
        if ('touches' in domEvent) {
            if (domEvent.touches.length === 0)
                return null;
            clientX = domEvent.touches[0].clientX;
            clientY = domEvent.touches[0].clientY;
        }
        else {
            clientX = domEvent.clientX;
            clientY = domEvent.clientY;
        }
        // const map = this.target as Map;
        const dom = this.getContainer();
        if (!dom)
            return null;
        const rect = dom.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    get isInteracting() {
        // Safety check: return false if sceneRenderer destroyed
        // 安全检查：如果sceneRenderer已销毁，返回false
        if (!this.sceneRenderer)
            return false;
        return this.sceneRenderer.isInteracting;
    }
    /**
     * Internal tool: Get distance from current camera to target point.
     * 内部工具：获取当前相机到目标点的距离
     */
    _getCameraDistance() {
        const controls = this.sceneRenderer.controls;
        const cam = this.sceneRenderer.camera;
        const target = controls?.target ?? this.prjcenter;
        if (controls && typeof controls.getDistance === "function") {
            return controls.getDistance();
        }
        return cam.position.distanceTo(target);
    }
    /**
     * Internal tool: Calculate theoretically reachable zoom range of view based on current control distance limits.
     * 内部工具：根据当前控制器的距离限制，推算视图理论可达的 zoom 区间
     *
     * @returns {Object} `{ min: number, max: number }`
     */
    _getViewZoomRange() {
        const controls = this.sceneRenderer.controls;
        // Actual zoomable distance range of controls
        // 控制器实际可缩放的距离范围
        const minDist = typeof controls?.minDistance === "number"
            ? controls.minDistance
            : this._minZoomDistance;
        const maxDist = typeof controls?.maxDistance === "number"
            ? controls.maxDistance
            : this._maxZoomDistance;
        if (minDist <= 0 || minDist >= maxDist) {
            // Anomaly: Degrade to "Single Zoom"
            // 异常情况：退化为“只有一个 zoom”
            const dataZoom = this.getTileZoom();
            return { min: dataZoom, max: dataZoom };
        }
        // Distance ratio: How many times distance change controls can cover
        // 距离比例：控制器能覆盖多少倍的距离变化
        const distRatio = maxDist / minDist;
        // Assumption: Distance halves for every 1 level zoom in
        // 假设：每放大 1 级，距离缩小 2 倍
        const extraSpan = Math.log2(distRatio); // Could be decimal 可能是小数
        // Data level range
        // 数据层级范围
        const baseLayer = this.getLayers()
            .find((layer) => layer.isBaseLayer === true);
        const dataMin = baseLayer?.minLevel ?? this.minLevel;
        const dataMax = baseLayer?.maxLevel ?? this.maxLevel;
        const minZoomFromView = dataMin;
        const maxZoomFromView = dataMax + extraSpan;
        return { min: minZoomFromView, max: maxZoomFromView };
    }
    /**
     * Fly to specified position.
     * 飞行到指定位置
     *
     * @param flyConfig Flight parameters object. Can specify either:
     *                  1. center + cameraCoord: Directly specify target and camera positions
     *                  2. center + distance/pitch/bearing: Specify target and viewing angle
     *                飞行参数对象。可以指定：
     *                  1. center + cameraCoord：直接指定目标点和相机位置
     *                  2. center + distance/pitch/bearing：指定目标点和视角参数
     */
    flyTo(flyConfig) {
        this.sceneRenderer.flyToAdvanced(flyConfig);
    }
    /**
     * Fly to point position.
     * 飞行到指定点的位置
     *
     * @param flyConfig Flight parameters object
     *                飞行参数对象
     */
    easeTo(flyConfig) {
        this.sceneRenderer.easeTo(flyConfig);
    }
    /**
     * Destroy map instance, release all resources.
     * 销毁地图实例，释放所有资源
     *
     * @description
     * This method cleans up the following resources:
     * 1. Remove all event listeners
     * 2. Clear all layers
     * 3. Destroy collision engine
     * 4. Destroy sceneRenderer (including renderer, scene, controls, etc.)
     * 5. Clean up DOM container
     *
     * 该方法会清理以下资源：
     * 1. 移除所有事件监听器
     * 2. 清空所有图层
     * 3. 销毁碰撞引擎
     * 4. 销毁sceneRenderer（包括renderer、scene、controls等）
     * 5. 清理DOM容器
     */
    dispose() {
        // console.log('🗑️ Destroying map instance... 开始销毁地图实例...');
        try {
            // 1. Clear all handlers (Including FeatureEvents etc., removes DOM event listeners)
            // 1. 清除所有handler（包括FeatureEvents等，会移除DOM事件监听）
            this._clearHandlers();
            // console.log('✅ Handlers cleared Handlers已清除');
            // 2. Remove all event listeners (Critical step to avoid triggering events during cleanup)
            // 2. 移除所有事件监听器（关键步骤，避免后续操作触发事件）
            const eventTypes = ['viewchange', 'movestart', 'moveend', 'zoomstart', 'zoom', 'zoomend', 'load'];
            eventTypes.forEach(eventType => {
                const listeners = this._listenerMap?.get(eventType);
                if (listeners) {
                    listeners.forEach((_wrapper, listener) => {
                        this.off(eventType, listener);
                    });
                }
            });
            // console.log('✅ Event listeners removed 事件监听器已移除');
            // 3. Clear all layers
            // 3. 清空所有图层
            this.clearLayers();
            // console.log('✅ All layers cleared 所有图层已清空');
            // 4. Destroy collision engine
            // 4. 销毁碰撞引擎
            if (this._collisionEngine) {
                // @ts-ignore
                this._collisionEngine = null;
                // console.log('✅ Collision engine destroyed 碰撞引擎已销毁');
            }
            // 5. Destroy layer container
            // 5. 销毁图层容器
            if (this._layerGroup) {
                this._layerGroup.clear();
                // @ts-ignore
                this._layerGroup = null;
                // console.log('✅ Layer container destroyed 图层容器已销毁');
            }
            // 7. Destroy canvas manager
            // 7. 销毁画布管理器
            if (this._canvasMgr) {
                // @ts-ignore
                this._canvasMgr = null;
                // console.log('✅ Canvas manager destroyed 画布管理器已销毁');
            }
            // 8. Destroy sceneRenderer (Most important step)
            // 8. 销毁sceneRenderer（最重要的一步）
            if (this.sceneRenderer) {
                this.sceneRenderer.destroy();
                // @ts-ignore
                this.sceneRenderer = null;
                // console.log('✅ sceneRenderer destroyed sceneRenderer已销毁');
            }
            // 9. Clear event map
            // 9. 清空事件映射表
            this._eventState = {
                load: { listened: false }
            };
            // console.log('✅ Map instance destruction completed 地图实例销毁完成');
        }
        catch (error) {
            console.error('Error destroying map 销毁地图时出错:', error);
        }
    }
}
Map.mergeOptions(options);
