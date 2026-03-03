import type { LngLatLike } from "../../types";
import type { DomEventMap } from "../Map.DomEvent";
import { MapTool, type MapToolOptions } from "./MapTool";
import type { PaintInput } from "../../style";
import { OverlayLayer } from "../../layer/OverlayLayer";
import { Feature } from "../../feature/Feature";

/**
 * 单个绘制模式定义：
 * - actions: 参与的事件序列（目前主要是 click / mousemove / dblclick）
 * - create: 第一次点击时创建几何对象
 * - update: 每次新增顶点或移动时更新几何
 * - generate: 结束时生成最终结果（可以是 Feature，也可以是原几何）
 * - clickLimit: 最少点击次数（达到就可以结束，通常配合 dblclick）
 */
export type DrawModeDefinition = {
    actions: Array<"click" | "mousemove" | "dblclick">;
    create: (start: LngLatLike, evt: DomEventMap) => any;
    update: (coords: LngLatLike[], geometry: any, evt: DomEventMap) => void;
    generate: (geometry: any, coords: LngLatLike[]) => any;
    clickLimit?: number;
};
// 内部草图图层，实现 validateFeature 全通过
class DraftLayer extends OverlayLayer<Feature> {
    constructor(id: string) {
        // 给草图层一个默认海拔，例如 1（单位跟你地图一致，一般比瓦片大一点就行）
        super(id, { altitude: 1 });
    }
    protected validateFeature(feature: Feature): boolean {
        return !!feature;
    }
}

export type BaseDrawToolOptions = MapToolOptions & {
    /** 模式名称，例如 'line' / 'polygon' / 'point' */
    mode: string;
    /** 是否在一次绘制结束后自动禁用工具 */
    once?: boolean;
};

/**
 * Paint configuration type
 */
export type DrawToolPaintOptions = {
    /** Main geometry paint (point / line / fill) */
    geometryPaint?: PaintInput;
    /**
     * Vertex (anchor point) paint
     * - Pass null to disable anchor point rendering
     * - Omit this field to keep current setting
     */
    vertexPaint?: PaintInput | null;
};

export type DrawToolOptions = BaseDrawToolOptions & DrawToolPaintOptions;
/**
 * 全局模式注册表
 */
const registeredModes: Record<string, DrawModeDefinition> = {};

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
    /** 配置 */
    declare options: DrawToolOptions;

    /** 当前模式定义 */
    private _modeDef?: DrawModeDefinition;
    /** 当前绘制中的顶点序列 */
    private _clickCoords: LngLatLike[] = [];
    /** 是否正在绘制中 */
    private _isDrawing = false;
    /** 当前绘制中的几何对象（由 mode.create/create 返回） */
    private _geometry: any;
    /** 内部统一草图图层 */
    private _draftLayer?: DraftLayer;

    /**
     * 注册一个绘制模式
     */
    static registerMode(name: string, def: DrawModeDefinition) {
        registeredModes[name.toLowerCase()] = def;
    }

    /**
     * 获取已注册的模式
     */
    static getModeDefinition(name: string): DrawModeDefinition | undefined {
        return registeredModes[name.toLowerCase()];
    }

    constructor(options: DrawToolOptions) {
        // 交给 MapTool/BaseMixin 处理 options
        super(options);
        // 设置默认值
        this.options.once = this.options.once ?? false;
        this._ensureMode();
    }

    /**
     * 获取当前模式名称（统一转为小写）
     */
    getMode(): string {
        return (this.options.mode || "").toLowerCase();
    }

    /**
     * 设置绘制模式：会清空当前绘制状态
     */
    setMode(mode: string): this {
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
    setPaint(paint: DrawToolPaintOptions): this {
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
    protected getEvents() {
        return {
            click: this._handleClick.bind(this),
            mousemove: this._handleMouseMove.bind(this),
            dblclick: this._handleDblClick.bind(this),
        };
    }

    /**
     * 启用时同步一下模式定义
     */
    protected override onEnable() {
        this._ensureMode();
    }
    /**
     * 禁用时结束当前绘制，并清理草图图层
     */
    protected override onDisable() {
        this._finishDrawingSilently();
        this._destroyDraftLayer();
    }

    /**
     * 确保当前 mode 有对应的定义
     */
    private _ensureMode() {
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
    private _handleClick(evt: DomEventMap) {
        if (!this._modeDef) return;
        if (!evt.coordinate) return;

        const coord = evt.coordinate;
        const mode = this._modeDef;

        // 包装一下事件，附带当前 tool，方便模式内部访问 options / map
        const ctxEvt: any = { ...evt, drawTool: this };

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
        } else {
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

        if (
            mode.clickLimit &&
            this._clickCoords.length >= mode.clickLimit
        ) {
            this._finishDrawing(ctxEvt);
        }
    }
    /**
     * 处理 mousemove 事件：
     * - 仅在绘制中才更新几何
     * - 不修改 _clickCoords，只用临时 coords 传给 update
     */
    private _handleMouseMove(evt: DomEventMap) {
        if (!this._modeDef) return;
        if (!this._isDrawing) return;
        if (!evt.coordinate) return;

        const mode = this._modeDef;
        const tempCoords = [...this._clickCoords, evt.coordinate];
        const ctxEvt: any = { ...evt, drawTool: this };

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
    private _handleDblClick(evt: DomEventMap) {
        if (!this._modeDef) return;
        if (!this._isDrawing) return;

        const ctxEvt: any = { ...evt, drawTool: this };
        this._finishDrawing(ctxEvt);
    }

    /**
     * 正常结束一次绘制：调用 mode.generate 并触发 drawend
     */
    private _finishDrawing(evt: DomEventMap | any) {
        if (!this._modeDef || !this._isDrawing) return;

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
    private _finishDrawingSilently() {
        this._isDrawing = false;
        this._clickCoords = [];
        this._geometry = undefined;
    }
    /**
    * 内部：获取或创建统一草图图层
    */
    public _getOrCreateDraftLayer(): OverlayLayer<Feature> {
        if (this._draftLayer) return this._draftLayer;
        const map = this.getMap();
        if (!map) {
            throw new Error("DrawTool: 尚未绑定地图，请先调用 addTo(map)");
        }
        const id = `__draw_draft_${Date.now().toString(36)}`;
        const layer = new DraftLayer(id);
        (map as any).addLayer(layer);
        this._draftLayer = layer;
        return layer;
    }
    /**
    * 内部：销毁草图图层
    */
    private _destroyDraftLayer() {
        const map = this.getMap();
        if (map && this._draftLayer) {
            map.removeLayer(this._draftLayer.getId());
        }
        this._draftLayer = undefined;
    }
}