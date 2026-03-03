import { DrawTool } from "./DrawTool";
import { LineString, Marker, Polygon } from "../../feature";
import { Paint } from "../../style";
/**
 * Point mode:
 * - Single click determines a point
 * - _clickCoords will only store one coordinate
 */
const pointMode = {
    actions: ["click", "mousemove"],
    create(start, evt) {
        const tool = evt.drawTool;
        const draftLayer = tool._getOrCreateDraftLayer();
        const pointPaint = toPaint(tool.options.geometryPaint, { type: "circle", size: 10, color: "#00ffff" });
        const geoJSON = {
            type: "Point",
            coordinates: start
        };
        const draftMarker = new Marker({
            geometry: geoJSON,
            paint: pointPaint
        });
        draftMarker.addTo(draftLayer);
        draftMarker.initializeGeometry();
        return {
            tool,
            draftLayer,
            draftMarker
        };
    },
    update(coords, state, _evt) {
        const draftMarker = state?.draftMarker;
        if (!draftMarker)
            return;
        const last = coords[coords.length - 1];
        draftMarker._geometry = {
            type: "Point",
            coordinates: last
        };
        draftMarker._worldLngLatLikes = draftMarker._coordsTransform();
        draftMarker._buildRenderObject && draftMarker._buildRenderObject();
    },
    generate(state, coords) {
        const tool = state.tool;
        if (!coords.length)
            return null;
        // 清除当前绘制对应的草图点
        if (state.draftMarker) {
            state.draftMarker._remove();
            state.draftMarker = null;
        }
        // 返回“干净”的最终点 Feature
        const pointPaint = toPaint(tool.options.geometryPaint, { type: "basic-point", size: 10, color: "#00ffff" });
        const last = coords[coords.length - 1];
        const finalMarker = new Marker({
            geometry: {
                type: "Point",
                coordinates: last
            },
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
const lineMode = {
    actions: ["click", "mousemove", "dblclick"],
    create(start, evt) {
        const tool = evt.drawTool;
        const draftLayer = tool._getOrCreateDraftLayer();
        const linePaint = toPaint(tool.options.geometryPaint, { type: "basic-line", color: "#ff0000", width: 2 });
        // vertexPaint === null 表示“禁用锚点”；undefined 或 样式对象 则正常使用
        const vertexPaint = tool.options.vertexPaint === null
            ? undefined
            : toPaint(tool.options.vertexPaint, { type: "basic-point", size: 8, color: "#00ffff" });
        const lineGeoJSON = {
            type: "LineString",
            coordinates: [start]
        };
        const draftLine = new LineString({
            geometry: lineGeoJSON,
            paint: linePaint
        });
        draftLine.addTo(draftLayer);
        const draftAnchors = [];
        // 只有在有 vertexPaint 时才画锚点
        if (vertexPaint) {
            const markerGeoJSON = {
                type: "Point",
                coordinates: start
            };
            const firstAnchor = new Marker({
                geometry: markerGeoJSON,
                paint: vertexPaint
            });
            firstAnchor.addTo(draftLayer);
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
    update(coords, state, evt) {
        if (!state)
            return;
        const draftLayer = state.draftLayer;
        if (!coords || coords.length < 2) {
            return;
        }
        if (state.draftLine) {
            state.draftLine._remove();
            state.draftLine = null;
        }
        const lineGeoJSON = {
            type: "LineString",
            coordinates: coords
        };
        const newDraftLine = new LineString({
            geometry: lineGeoJSON,
            paint: state.linePaint
        });
        newDraftLine.addTo(draftLayer);
        state.draftLine = newDraftLine;
        // 只有存在 vertexPaint 时才新增锚点
        if (evt.eventName === "click" && state.vertexPaint) {
            const last = coords[coords.length - 1];
            const markerGeoJSON = {
                type: "Point",
                coordinates: last
            };
            const anchor = new Marker({
                geometry: markerGeoJSON,
                paint: state.vertexPaint
            });
            anchor.addTo(draftLayer);
            state.draftAnchors.push(anchor);
        }
    },
    generate(state, coords) {
        const tool = state.tool;
        if (!coords.length)
            return null;
        // 清除草图线
        if (state.draftLine) {
            state.draftLine._remove();
            state.draftLine = null;
        }
        // 清除草图锚点（如果有）
        if (Array.isArray(state.draftAnchors)) {
            for (const anchor of state.draftAnchors) {
                anchor?._remove();
            }
            state.draftAnchors = [];
        }
        const linePaint = toPaint(tool.options.geometryPaint, { type: "basic-line", color: "#ff0000", width: 2 });
        const finalLine = new LineString({
            geometry: {
                type: "LineString",
                coordinates: coords
            },
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
const polygonMode = {
    actions: ["click", "mousemove", "dblclick"],
    create(start, evt) {
        const tool = evt.drawTool;
        const draftLayer = tool._getOrCreateDraftLayer();
        const polygonPaint = toPaint(tool.options.geometryPaint, { type: "basic-polygon", color: "#00ff00", opacity: 0.5 });
        // null 表示不画锚点
        const vertexPaint = tool.options.vertexPaint === null
            ? undefined
            : toPaint(tool.options.vertexPaint, { type: "basic-point", size: 8, color: "#00ffff" });
        const draftAnchors = [];
        // 有 vertexPaint 才画第一个锚点
        if (vertexPaint) {
            const markerGeoJSON = {
                type: "Point",
                coordinates: start
            };
            const firstAnchor = new Marker({
                geometry: markerGeoJSON,
                paint: vertexPaint
            });
            firstAnchor.addTo(draftLayer);
            firstAnchor.initializeGeometry();
            draftAnchors.push(firstAnchor);
        }
        return {
            tool,
            draftLayer,
            draftPolygon: null, // 草图面
            draftEdgeLine: null, // 点数<3时的草图边线
            draftAnchors,
            polygonPaint,
            vertexPaint
        };
    },
    update(coords, state, evt) {
        if (!state)
            return;
        const draftLayer = state.draftLayer;
        // 点击时增加草图锚点（如果启用了锚点样式）
        if (evt.eventName === "click" && state.vertexPaint) {
            const last = coords[coords.length - 1];
            const markerGeoJSON = {
                type: "Point",
                coordinates: last
            };
            const anchor = new Marker({
                geometry: markerGeoJSON,
                paint: state.vertexPaint
            });
            anchor.addTo(draftLayer);
            anchor.initializeGeometry();
            state.draftAnchors.push(anchor);
        }
        // 没点或只有一个点：只画锚点，不画线/面
        if (!coords || coords.length < 2) {
            // 清掉旧的边线/面
            if (state.draftEdgeLine) {
                state.draftEdgeLine._remove();
                state.draftEdgeLine = null;
            }
            if (state.draftPolygon) {
                state.draftPolygon._remove();
                state.draftPolygon = null;
            }
            return;
        }
        // 恰好两个点：画一条“边线草图”，不画面
        if (coords.length === 2) {
            // 清掉旧 Polygon
            if (state.draftPolygon) {
                state.draftPolygon._remove();
                state.draftPolygon = null;
            }
            // 重建边线草图
            if (state.draftEdgeLine) {
                state.draftEdgeLine._remove();
                state.draftEdgeLine = null;
            }
            const lineGeoJSON = {
                type: "LineString",
                coordinates: coords
            };
            // 注意：LineString 只能用 'basic-line' 样式
            // 尝试从 polygonPaint 里取颜色，取不到就用默认绿色
            const edgeColor = (state.polygonPaint?.config && state.polygonPaint.config.color) ||
                "#00ff00";
            const edgeLinePaint = new Paint({
                type: "line",
                color: edgeColor,
                width: 2
            });
            const edgeLine = new LineString({
                geometry: lineGeoJSON,
                paint: edgeLinePaint
            });
            edgeLine.addTo(draftLayer);
            state.draftEdgeLine = edgeLine;
            return;
        }
        // 点数 ≥ 3：清掉边线，用 Polygon 做真正的草图面
        if (state.draftEdgeLine) {
            state.draftEdgeLine._remove();
            state.draftEdgeLine = null;
        }
        const closed = coords.slice();
        const first = closed[0];
        const last = closed[closed.length - 1];
        if (first[0] !== last[0] ||
            first[1] !== last[1] ||
            (first[2] || 0) !== (last[2] || 0)) {
            closed.push(first);
        }
        if (state.draftPolygon) {
            state.draftPolygon._remove();
            state.draftPolygon = null;
        }
        const polyGeoJSON = {
            type: "Polygon",
            coordinates: [closed]
        };
        const draftPolygon = new Polygon({
            geometry: polyGeoJSON,
            paint: state.polygonPaint
        });
        draftPolygon.addTo(draftLayer);
        state.draftPolygon = draftPolygon;
    },
    generate(state, coords) {
        const tool = state.tool;
        if (coords.length < 3)
            return null;
        // 清除草图面
        if (state.draftPolygon) {
            state.draftPolygon._remove();
            state.draftPolygon = null;
        }
        // 清除草图边线
        if (state.draftEdgeLine) {
            state.draftEdgeLine._remove();
            state.draftEdgeLine = null;
        }
        // 清除草图锚点
        if (Array.isArray(state.draftAnchors)) {
            for (const anchor of state.draftAnchors) {
                anchor?._remove();
            }
            state.draftAnchors = [];
        }
        const polygonPaint = toPaint(tool.options.geometryPaint, { type: "basic-polygon", color: "#00ff00", opacity: 0.5 });
        const closed = coords.slice();
        const first = closed[0];
        const last = closed[closed.length - 1];
        if (first[0] !== last[0] ||
            first[1] !== last[1] ||
            (first[2] || 0) !== (last[2] || 0)) {
            closed.push(first);
        }
        const finalPolygon = new Polygon({
            geometry: {
                type: "Polygon",
                coordinates: [closed]
            },
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
function toPaint(input, fallback) {
    return Paint.create(input || fallback);
}
