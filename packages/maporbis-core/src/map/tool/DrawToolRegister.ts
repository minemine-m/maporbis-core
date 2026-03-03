import type { LngLatLike } from "../../types";
import { DrawTool, type DrawModeDefinition } from "./DrawTool";
import { LineString, Marker, Polygon } from "../../feature";
import type { PaintInput } from "../../style";
import { Paint } from "../../style";

/**
 * Point mode:
 * - Single click determines a point
 * - _clickCoords will only store one coordinate
 */
const pointMode: DrawModeDefinition = {
    actions: ["click", "mousemove"],
    create(start: LngLatLike, evt: any) {
        const tool = evt.drawTool as DrawTool;
        const draftLayer = tool._getOrCreateDraftLayer();

        const pointPaint = toPaint(
            tool.options.geometryPaint,
            { type: "circle", size: 10, color: "#00ffff" } as any
        );

        const geoJSON = {
            type: "Point",
            coordinates: start
        };

        const draftMarker = new Marker({
            geometry: geoJSON as any,
            paint: pointPaint
        });

        draftMarker.addTo(draftLayer as any);
        draftMarker.initializeGeometry();

        return {
            tool,
            draftLayer,
            draftMarker
        };
    },
    update(coords: LngLatLike[], state: any, _evt: any) {
        const draftMarker = state?.draftMarker as Marker;
        if (!draftMarker) return;

        const last = coords[coords.length - 1];
        draftMarker._geometry = {
            type: "Point",
            coordinates: last
        } as any;

        draftMarker._worldLngLatLikes = draftMarker._coordsTransform() as any;
        draftMarker._buildRenderObject && draftMarker._buildRenderObject();
    },
    generate(state: any, coords: LngLatLike[]) {
        const tool: DrawTool = state.tool;
        if (!coords.length) return null;

        // 清除当前绘制对应的草图点
        if (state.draftMarker) {
            (state.draftMarker as Marker)._remove();
            state.draftMarker = null;
        }

        // 返回“干净”的最终点 Feature
        const pointPaint = toPaint(
            tool.options.geometryPaint,
            { type: "basic-point", size: 10, color: "#00ffff" } as any
        );
        const last = coords[coords.length - 1];

        const finalMarker = new Marker({
            geometry: {
                type: "Point",
                coordinates: last
            } as any,
            paint: pointPaint
        });

        return finalMarker;
    },
    clickLimit: 1
};

/**
 * Line 模式：
 * - 第一点击：确定起点
 * - 后续点击：增加锚点
 * - 鼠标移动：用 [所有锚点 + 当前鼠标] 更新线，形成“橡皮筋”效果
 * - 双击结束（依赖 DrawTool 内部的 dblclick 逻辑）
 */
const lineMode: DrawModeDefinition = {
    actions: ["click", "mousemove", "dblclick"],
    create(start: LngLatLike, evt: any) {
        const tool = evt.drawTool as DrawTool;
        const draftLayer = tool._getOrCreateDraftLayer();

        const linePaint = toPaint(
            tool.options.geometryPaint,
            { type: "basic-line", color: "#ff0000", width: 2 } as any
        );
        // vertexPaint === null 表示“禁用锚点”；undefined 或 样式对象 则正常使用
        const vertexPaint =
            tool.options.vertexPaint === null
                ? undefined
                : toPaint(
                    tool.options.vertexPaint,
                    { type: "basic-point", size: 8, color: "#00ffff" } as any
                );

        const lineGeoJSON = {
            type: "LineString",
            coordinates: [start]
        };
        const draftLine = new LineString({
            geometry: lineGeoJSON as any,
            paint: linePaint
        });
        draftLine.addTo(draftLayer as any);

        const draftAnchors: Marker[] = [];

        // 只有在有 vertexPaint 时才画锚点
        if (vertexPaint) {
            const markerGeoJSON = {
                type: "Point",
                coordinates: start
            };
            const firstAnchor = new Marker({
                geometry: markerGeoJSON as any,
                paint: vertexPaint
            });
            firstAnchor.addTo(draftLayer as any);
            draftAnchors.push(firstAnchor);
        }

        return {
            tool,
            draftLayer,
            draftLine,
            draftAnchors,
            linePaint,
            vertexPaint
        };
    },
    update(coords: LngLatLike[], state: any, evt: any) {
        if (!state) return;
        const draftLayer = state.draftLayer;

        if (!coords || coords.length < 2) {
            return;
        }

        if (state.draftLine) {
            (state.draftLine as LineString)._remove();
            state.draftLine = null;
        }

        const lineGeoJSON = {
            type: "LineString",
            coordinates: coords
        };
        const newDraftLine = new LineString({
            geometry: lineGeoJSON as any,
            paint: state.linePaint
        });
        newDraftLine.addTo(draftLayer as any);
        state.draftLine = newDraftLine;

        // 只有存在 vertexPaint 时才新增锚点
        if (evt.eventName === "click" && state.vertexPaint) {
            const last = coords[coords.length - 1];
            const markerGeoJSON = {
                type: "Point",
                coordinates: last
            };
            const anchor = new Marker({
                geometry: markerGeoJSON as any,
                paint: state.vertexPaint
            });
            anchor.addTo(draftLayer as any);
            state.draftAnchors.push(anchor);
        }
    },
    generate(state: any, coords: LngLatLike[]) {
        const tool: DrawTool = state.tool;
        if (!coords.length) return null;

        // 清除草图线
        if (state.draftLine) {
            (state.draftLine as LineString)._remove();
            state.draftLine = null;
        }
        // 清除草图锚点（如果有）
        if (Array.isArray(state.draftAnchors)) {
            for (const anchor of state.draftAnchors as Marker[]) {
                anchor?._remove();
            }
            state.draftAnchors = [];
        }

        const linePaint = toPaint(
            tool.options.geometryPaint,
            { type: "basic-line", color: "#ff0000", width: 2 } as any
        );

        const finalLine = new LineString({
            geometry: {
                type: "LineString",
                coordinates: coords
            } as any,
            paint: linePaint
        });

        return finalLine;
    }
};

/**
 * Polygon 模式：
 * - 点击若干次加入锚点
 * - 鼠标移动时：最后一个点跟随鼠标（橡皮筋）
 * - 双击结束
 * - generate 时可选地把首尾闭合
 */
const polygonMode: DrawModeDefinition = {
    actions: ["click", "mousemove", "dblclick"],
    create(start: LngLatLike, evt: any) {
        const tool = evt.drawTool as DrawTool;
        const draftLayer = tool._getOrCreateDraftLayer();

        const polygonPaint = toPaint(
            tool.options.geometryPaint,
            { type: "basic-polygon", color: "#00ff00", opacity: 0.5 } as any
        );
        // null 表示不画锚点
        const vertexPaint =
            tool.options.vertexPaint === null
                ? undefined
                : toPaint(
                    tool.options.vertexPaint,
                    { type: "basic-point", size: 8, color: "#00ffff" } as any
                );

        const draftAnchors: Marker[] = [];

        // 有 vertexPaint 才画第一个锚点
        if (vertexPaint) {
            const markerGeoJSON = {
                type: "Point",
                coordinates: start
            };
            const firstAnchor = new Marker({
                geometry: markerGeoJSON as any,
                paint: vertexPaint
            });
            firstAnchor.addTo(draftLayer as any);
            firstAnchor.initializeGeometry();
            draftAnchors.push(firstAnchor);
        }

        return {
            tool,
            draftLayer,
            draftPolygon: null as Polygon | null,   // 草图面
            draftEdgeLine: null as LineString | null, // 点数<3时的草图边线
            draftAnchors,
            polygonPaint,
            vertexPaint
        };
    },
    update(coords: LngLatLike[], state: any, evt: any) {
        if (!state) return;
        const draftLayer = state.draftLayer;

        // 点击时增加草图锚点（如果启用了锚点样式）
        if (evt.eventName === "click" && state.vertexPaint) {
            const last = coords[coords.length - 1];
            const markerGeoJSON = {
                type: "Point",
                coordinates: last
            };
            const anchor = new Marker({
                geometry: markerGeoJSON as any,
                paint: state.vertexPaint
            });
            anchor.addTo(draftLayer as any);
            anchor.initializeGeometry();
            state.draftAnchors.push(anchor);
        }

        // 没点或只有一个点：只画锚点，不画线/面
        if (!coords || coords.length < 2) {
            // 清掉旧的边线/面
            if (state.draftEdgeLine) {
                (state.draftEdgeLine as LineString)._remove();
                state.draftEdgeLine = null;
            }
            if (state.draftPolygon) {
                (state.draftPolygon as Polygon)._remove();
                state.draftPolygon = null;
            }
            return;
        }

        // 恰好两个点：画一条“边线草图”，不画面
        if (coords.length === 2) {
            // 清掉旧 Polygon
            if (state.draftPolygon) {
                (state.draftPolygon as Polygon)._remove();
                state.draftPolygon = null;
            }
            // 重建边线草图
            if (state.draftEdgeLine) {
                (state.draftEdgeLine as LineString)._remove();
                state.draftEdgeLine = null;
            }

            const lineGeoJSON = {
                type: "LineString",
                coordinates: coords
            };

            // 注意：LineString 只能用 'basic-line' 样式
            // 尝试从 polygonPaint 里取颜色，取不到就用默认绿色
            const edgeColor =
                (state.polygonPaint?.config && (state.polygonPaint as any).config.color) ||
                "#00ff00";

            const edgeLinePaint = new Paint({
                type: "line",
                color: edgeColor,
                width: 2
            } as any);

            const edgeLine = new LineString({
                geometry: lineGeoJSON as any,
                paint: edgeLinePaint
            });
            edgeLine.addTo(draftLayer as any);
            state.draftEdgeLine = edgeLine;
            return;
        }
        
        // 点数 ≥ 3：清掉边线，用 Polygon 做真正的草图面
        if (state.draftEdgeLine) {
            (state.draftEdgeLine as LineString)._remove();
            state.draftEdgeLine = null;
        }

        const closed = coords.slice();
        const first = closed[0];
        const last = closed[closed.length - 1];
        if (
            first[0] !== last[0] ||
            first[1] !== last[1] ||
            (first[2] || 0) !== (last[2] || 0)
        ) {
            closed.push(first);
        }

        if (state.draftPolygon) {
            (state.draftPolygon as Polygon)._remove();
            state.draftPolygon = null;
        }

        const polyGeoJSON = {
            type: "Polygon",
            coordinates: [closed]
        };
        const draftPolygon = new Polygon({
            geometry: polyGeoJSON as any,
            paint: state.polygonPaint
        });
        draftPolygon.addTo(draftLayer as any);
        state.draftPolygon = draftPolygon;
    },
    generate(state: any, coords: LngLatLike[]) {
        const tool: DrawTool = state.tool;
        if (coords.length < 3) return null;

        // 清除草图面
        if (state.draftPolygon) {
            (state.draftPolygon as Polygon)._remove();
            state.draftPolygon = null;
        }
        // 清除草图边线
        if (state.draftEdgeLine) {
            (state.draftEdgeLine as LineString)._remove();
            state.draftEdgeLine = null;
        }
        // 清除草图锚点
        if (Array.isArray(state.draftAnchors)) {
            for (const anchor of state.draftAnchors as Marker[]) {
                anchor?._remove();
            }
            state.draftAnchors = [];
        }

        const polygonPaint = toPaint(
            tool.options.geometryPaint,
            { type: "basic-polygon", color: "#00ff00", opacity: 0.5 } as any
        );

        const closed = coords.slice();
        const first = closed[0];
        const last = closed[closed.length - 1];
        if (
            first[0] !== last[0] ||
            first[1] !== last[1] ||
            (first[2] || 0) !== (last[2] || 0)
        ) {
            closed.push(first);
        }

        const finalPolygon = new Polygon({
            geometry: {
                type: "Polygon",
                coordinates: [closed]
            } as any,
            paint: polygonPaint
        });

        return finalPolygon;
    }
};

/** 模式的注册 */
DrawTool.registerMode("point", pointMode);
DrawTool.registerMode("line", lineMode);
DrawTool.registerMode("polygon", polygonMode);

/** Utility: PaintInput -> Paint instance */
function toPaint(input: PaintInput | undefined, fallback: PaintInput): Paint {
    return Paint.create(input || fallback) as Paint;
}