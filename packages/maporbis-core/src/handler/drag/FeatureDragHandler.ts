import Handler from "../Handler";
import { Feature } from "../../feature/Feature";
/**
 * Feature drag handler class
 * 要素拖拽处理器类
 * @extends Handler
  * @category Handler
 */
export class FeatureDragHandler extends Handler {
    declare public target: Feature;
    private _isDragging = false;
    private _lastCoord: [number, number] | null = null;
    /**
     * Save bound function references to ensure correct removal of event listeners
     * 保存绑定后的函数引用，确保能正确移除事件监听器
     */
    private _boundOnMouseDown = this._onMouseDown.bind(this);
    private _boundOnMouseMove = this._onMouseMove.bind(this);
    private _boundOnMouseUp = this._onMouseUp.bind(this);

    /**
     * Add event hooks
     * 添加事件钩子
     */
    addHooks() {
        // Listen for feature pick events 监听要素拾取事件
        this.target.on('mousedown', this._boundOnMouseDown);
    }

    /**
     * Remove event hooks
     * 移除事件钩子
     */
    removeHooks() {
        this.target.off('mousedown', this._boundOnMouseDown);
        this._stopDrag();
    }

    /**
     * Handle mouse down event
     * 处理鼠标按下事件
     * @param e Event object 事件对象
     */
    private _onMouseDown(e: any) {
        // console.log('FeatureDragHandler _onMouseDown', e);
        const map = this.target.getMap();
        if (!map || !this.target.options.draggable) return;

        this._isDragging = true;
        this._lastCoord = e.coordinate; // 记录起始点击的经纬度

        // Disable map panning to prevent interference
        // 禁止地图平移，防止干扰
        map.sceneRenderer.configure('draggable', false);

        map.on('mousemove', this._boundOnMouseMove);
        map.on('mouseup', this._boundOnMouseUp);

        this.target.fire('dragstart', e);
    }

    private _onMouseMove(e: any) {
        if (!this._isDragging || !this._lastCoord || !e.coordinate) return;

        const currentCoord = e.coordinate;
        const dx = currentCoord[0] - this._lastCoord[0];
        const dy = currentCoord[1] - this._lastCoord[1];

        // 2. 增加微小位移过滤，防止由于浮点数精度导致的无效更新
        if (Math.abs(dx) < 1e-8 && Math.abs(dy) < 1e-8) return;

        this._translate(dx, dy);

        this._lastCoord = currentCoord;
        this.target.fire('dragging', e);
    }

    private _onMouseUp(e: any) {
        this._stopDrag();
        this.target.fire('dragend', e);
    }

    /**
     * Stop dragging
     * 停止拖拽
     */
    private _stopDrag() {
        this._isDragging = false;
        const map = this.target.getMap();
        if (map) {
            map.sceneRenderer.configure('draggable', true); // Restore map panning 恢复地图平移
            map.off('mousemove', this._boundOnMouseMove);
            map.off('mouseup', this._boundOnMouseUp);
        }
    }

    /**
     * Translate feature coordinates
     * 平移要素坐标
     * @param dx Longitude offset 经度偏移量
     * @param dy Latitude offset 纬度偏移量
     */
    private _translate(dx: number, dy: number) {
        // 3. Core improvement: Recursively process coordinate arrays, automatically supporting Point, LineString, Polygon, MultiPolygon
        // 核心改进：递归处理坐标数组，自动支持 Point, LineString, Polygon, MultiPolygon
        const geo = (this.target as any)._geometry;
        if (!geo || !geo.coordinates) return;

        const translateCoord = (c: any): any => {
            // If it is an array of arrays (line or polygon coordinate structure), continue recursion
            // 如果是数组的数组（线或面的坐标结构），继续递归
            if (Array.isArray(c[0])) {
                return c.map(translateCoord);
            }
            // Reach the bottom level [lng, lat, alt?], apply offset while preserving altitude
            // 到达最底层的 [lng, lat, alt?]，应用偏移同时保持高度
            return [c[0] + dx, c[1] + dy, c[2] !== undefined ? c[2] : 0];
        };

        const newCoords = translateCoord(geo.coordinates);
        // Update coordinates directly and use fast update mode
        // 直接更新坐标并使用快速更新模式
        (geo as any).coordinates = newCoords;
        (this.target as any)._applyCoordinateChanges(true);
    }
}