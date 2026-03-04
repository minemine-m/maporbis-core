import { MapTool } from "./MapTool";
import { OverlayLayer } from "../../layer/OverlayLayer";
// 内部草图图层，实现 validateFeature 全通过
class DraftLayer extends OverlayLayer {
    constructor(id) {
        // 给草图层一个默认海拔，例如 1（单位跟你地图一致，一般比瓦片大一点就行）
        super(id, { altitude: 1 });
    }
    validateFeature(feature) {
        return !!feature;
    }
}
/**
 * 全局模式注册表
 */
const registeredModes = {};
/**
 * DrawTool：通用绘图工具
 *
 * 负责：
 * - 处理 Map 的 DOM 事件（click/mousemove/dblclick）
 * - 维护顶点序列 _clickCoords
 * - 调用模式定义的 create/update/generate
 * - 向外触发：drawstart / drawvertex / drawend / drawing 等事件
 */
export class DrawTool extends MapTool {
    /** 当前模式定义 */
    _modeDef;
    /** 当前绘制中的顶点序列 */
    _clickCoords = [];
    /** 是否正在绘制中 */
    _isDrawing = false;
    /** 当前绘制中的几何对象（由 mode.create/create 返回） */
    _geometry;
    /** 内部统一草图图层 */
    _draftLayer;
    /**
     * 注册一个绘制模式
     */
    static registerMode(name, def) {
        registeredModes[name.toLowerCase()] = def;
    }
    /**
     * 获取已注册的模式
     */
    static getModeDefinition(name) {
        return registeredModes[name.toLowerCase()];
    }
    constructor(options) {
        // 交给 MapTool/BaseMixin 处理 options
        super(options);
        // 设置默认值
        this.options.once = this.options.once ?? false;
        this._ensureMode();
    }
    /**
     * 获取当前模式名称（统一转为小写）
     */
    getMode() {
        return (this.options.mode || "").toLowerCase();
    }
    /**
     * 设置绘制模式：会清空当前绘制状态
     */
    setMode(mode) {
        this._finishDrawingSilently();
        this.options.mode = mode;
        this._ensureMode();
        return this;
    }
    /**
    * Set drawing paint (only affects new drawings started after this call)
    * - geometryPaint: main geometry paint (point/line/fill)
    * - vertexPaint: vertex paint, pass null to disable anchor point rendering
    */
    setPaint(paint) {
        if (paint.geometryPaint !== undefined) {
            this.options.geometryPaint = paint.geometryPaint;
        }
        if (Object.prototype.hasOwnProperty.call(paint, "vertexPaint")) {
            // Allow passing null to disable vertex paint
            this.options.vertexPaint = paint.vertexPaint ?? null;
        }
        return this;
    }
    /**
     * 子类实现：返回需要绑定到 Map 的事件映射
     */
    getEvents() {
        return {
            click: this._handleClick.bind(this),
            mousemove: this._handleMouseMove.bind(this),
            dblclick: this._handleDblClick.bind(this),
        };
    }
    /**
     * 启用时同步一下模式定义
     */
    onEnable() {
        this._ensureMode();
    }
    /**
     * 禁用时结束当前绘制，并清理草图图层
     */
    onDisable() {
        this._finishDrawingSilently();
        this._destroyDraftLayer();
    }
    /**
     * 确保当前 mode 有对应的定义
     */
    _ensureMode() {
        const name = this.getMode();
        const def = DrawTool.getModeDefinition(name);
        if (!def) {
            throw new Error(`DrawTool: mode "${name}" 未注册，请先调用 DrawTool.registerMode`);
        }
        this._modeDef = def;
    }
    /**
     * 处理 click 事件：
     * - 第一次 click：开始绘制，调用 mode.create，触发 drawstart
     * - 后续 click：追加顶点，调用 mode.update，触发 drawvertex
     * - 若达到 clickLimit，则结束绘制
     */
    _handleClick(evt) {
        if (!this._modeDef)
            return;
        if (!evt.coordinate)
            return;
        const coord = evt.coordinate;
        const mode = this._modeDef;
        // 包装一下事件，附带当前 tool，方便模式内部访问 options / map
        const ctxEvt = { ...evt, drawTool: this };
        if (!this._isDrawing) {
            // 开始绘制
            this._isDrawing = true;
            this._clickCoords = [coord];
            this._geometry = mode.create(coord, ctxEvt);
            this.fire("drawstart", {
                coordinate: coord,
                geometry: this._geometry,
                coords: [...this._clickCoords],
                originEvent: ctxEvt,
            });
        }
        else {
            // 追加顶点
            this._clickCoords.push(coord);
            mode.update(this._clickCoords, this._geometry, ctxEvt);
            this.fire("drawvertex", {
                coordinate: coord,
                geometry: this._geometry,
                coords: [...this._clickCoords],
                originEvent: ctxEvt,
            });
        }
        if (mode.clickLimit &&
            this._clickCoords.length >= mode.clickLimit) {
            this._finishDrawing(ctxEvt);
        }
    }
    /**
     * 处理 mousemove 事件：
     * - 仅在绘制中才更新几何
     * - 不修改 _clickCoords，只用临时 coords 传给 update
     */
    _handleMouseMove(evt) {
        if (!this._modeDef)
            return;
        if (!this._isDrawing)
            return;
        if (!evt.coordinate)
            return;
        const mode = this._modeDef;
        const tempCoords = [...this._clickCoords, evt.coordinate];
        const ctxEvt = { ...evt, drawTool: this };
        mode.update(tempCoords, this._geometry, ctxEvt);
        this.fire("drawing", {
            coordinate: evt.coordinate,
            geometry: this._geometry,
            coords: tempCoords,
            originEvent: ctxEvt,
        });
    }
    /**
     * 处理 dblclick：
     * - 如果正在绘制，则直接结束
     */
    _handleDblClick(evt) {
        if (!this._modeDef)
            return;
        if (!this._isDrawing)
            return;
        const ctxEvt = { ...evt, drawTool: this };
        this._finishDrawing(ctxEvt);
    }
    /**
     * 正常结束一次绘制：调用 mode.generate 并触发 drawend
     */
    _finishDrawing(evt) {
        if (!this._modeDef || !this._isDrawing)
            return;
        const mode = this._modeDef;
        const finalGeometry = mode.generate(this._geometry, [...this._clickCoords]);
        this.fire("drawend", {
            geometry: finalGeometry,
            coords: [...this._clickCoords],
            originEvent: evt,
        });
        this._isDrawing = false;
        this._clickCoords = [];
        this._geometry = undefined;
        if (this.options.once) {
            this.disable();
        }
    }
    /**
     * 静默结束（不触发 drawend），用于切换模式 / 禁用工具
     */
    _finishDrawingSilently() {
        this._isDrawing = false;
        this._clickCoords = [];
        this._geometry = undefined;
    }
    /**
    * 内部：获取或创建统一草图图层
    */
    _getOrCreateDraftLayer() {
        if (this._draftLayer)
            return this._draftLayer;
        const map = this.getMap();
        if (!map) {
            throw new Error("DrawTool: 尚未绑定地图，请先调用 addTo(map)");
        }
        const id = `__draw_draft_${Date.now().toString(36)}`;
        const layer = new DraftLayer(id);
        map.addLayer(layer);
        this._draftLayer = layer;
        return layer;
    }
    /**
    * 内部：销毁草图图层
    */
    _destroyDraftLayer() {
        const map = this.getMap();
        if (map && this._draftLayer) {
            map.removeLayer(this._draftLayer.getId());
        }
        this._draftLayer = undefined;
    }
}
