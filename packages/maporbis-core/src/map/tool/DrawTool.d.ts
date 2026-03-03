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
 * DrawTool：通用绘图工具
 *
 * 负责：
 * - 处理 Map 的 DOM 事件（click/mousemove/dblclick）
 * - 维护顶点序列 _clickCoords
 * - 调用模式定义的 create/update/generate
 * - 向外触发：drawstart / drawvertex / drawend / drawing 等事件
 */
export declare class DrawTool extends MapTool {
    /** 配置 */
    options: DrawToolOptions;
    /** 当前模式定义 */
    private _modeDef?;
    /** 当前绘制中的顶点序列 */
    private _clickCoords;
    /** 是否正在绘制中 */
    private _isDrawing;
    /** 当前绘制中的几何对象（由 mode.create/create 返回） */
    private _geometry;
    /** 内部统一草图图层 */
    private _draftLayer?;
    /**
     * 注册一个绘制模式
     */
    static registerMode(name: string, def: DrawModeDefinition): void;
    /**
     * 获取已注册的模式
     */
    static getModeDefinition(name: string): DrawModeDefinition | undefined;
    constructor(options: DrawToolOptions);
    /**
     * 获取当前模式名称（统一转为小写）
     */
    getMode(): string;
    /**
     * 设置绘制模式：会清空当前绘制状态
     */
    setMode(mode: string): this;
    /**
    * Set drawing paint (only affects new drawings started after this call)
    * - geometryPaint: main geometry paint (point/line/fill)
    * - vertexPaint: vertex paint, pass null to disable anchor point rendering
    */
    setPaint(paint: DrawToolPaintOptions): this;
    /**
     * 子类实现：返回需要绑定到 Map 的事件映射
     */
    protected getEvents(): {
        click: (evt: DomEventMap) => void;
        mousemove: (evt: DomEventMap) => void;
        dblclick: (evt: DomEventMap) => void;
    };
    /**
     * 启用时同步一下模式定义
     */
    protected onEnable(): void;
    /**
     * 禁用时结束当前绘制，并清理草图图层
     */
    protected onDisable(): void;
    /**
     * 确保当前 mode 有对应的定义
     */
    private _ensureMode;
    /**
     * 处理 click 事件：
     * - 第一次 click：开始绘制，调用 mode.create，触发 drawstart
     * - 后续 click：追加顶点，调用 mode.update，触发 drawvertex
     * - 若达到 clickLimit，则结束绘制
     */
    private _handleClick;
    /**
     * 处理 mousemove 事件：
     * - 仅在绘制中才更新几何
     * - 不修改 _clickCoords，只用临时 coords 传给 update
     */
    private _handleMouseMove;
    /**
     * 处理 dblclick：
     * - 如果正在绘制，则直接结束
     */
    private _handleDblClick;
    /**
     * 正常结束一次绘制：调用 mode.generate 并触发 drawend
     */
    private _finishDrawing;
    /**
     * 静默结束（不触发 drawend），用于切换模式 / 禁用工具
     */
    private _finishDrawingSilently;
    /**
    * 内部：获取或创建统一草图图层
    */
    _getOrCreateDraftLayer(): OverlayLayer<Feature>;
    /**
    * 内部：销毁草图图层
    */
    private _destroyDraftLayer;
}
