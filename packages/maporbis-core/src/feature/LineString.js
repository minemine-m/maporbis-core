import { Line } from './Line';
import { _createBasicLine, _createFlowLine, _createArrowLine, _createFlowTextureLine } from '../utils/createobject';
import { Line2 } from 'three-stdlib';
/** Default LineString feature configuration */
const options = {
// type: 'circle', // Defaults to Point geometry
};
/**
 * LineString feature class.
 * 线要素类
 *
 * @description
 * Represents a line feature in the 3D scene, inheriting from the Line base class.
 * Provides functionality for creating, updating, and rendering line features, supporting basic line styles.
 *
 * 表示3D场景中的线要素，继承自Line基类
 * 提供线要素的创建、更新和渲染功能，支持基础线样式
 *
 * @extends Line
 * @category Feature
 */
export class LineString extends Line {
    /**
     * Create a LineString feature instance.
     * 创建线要素实例
     *
     * @param options Configuration options for the line feature
     *                线要素配置
     */
    constructor(options) {
        super(options);
        /**
         * Feature type identifier.
         * 要素类型标识
         */
        Object.defineProperty(this, "_type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'LineString'
        });
    }
    /**
     * Convert feature to Three.js geometry.
     * 将要素转换为Three.js几何体
     *
     * @returns Promise<void>
     *
     * @description
     * Creates line geometry based on style configuration and performs coordinate transformation.
     *
     * 根据样式配置创建线几何体，并进行坐标转换
     */
    async _buildRenderObject() {
        // console.log(this._geometry, '_geometry  线要素')
        let { _vertexPoints } = this._coordsTransform(); // Perform coordinate transformation
        this._vertexPoints = _vertexPoints;
        if (this._paint) {
            if (this._renderObject) {
                this._disposeGeometry();
            }
            this._renderObject = await this._createObject(this._paint);
            // Update position (relative to map center)
            const map = this.getMap();
            if (map?.prjcenter) {
                this._renderObject.position.set(map.prjcenter.x, map.prjcenter.y, map.prjcenter.z);
            }
            // Ensure geometry is in the scene
            if (!this.children.includes(this._renderObject)) {
                this.add(this._renderObject);
            }
            // Force update matrix
            this.updateMatrixWorld(true);
            this._renderObject.updateMatrixWorld(true);
        }
    }
    /**
     * Quickly update geometry vertex positions (without rebuilding the entire geometry).
     * 快速更新几何体顶点位置（不重建整个几何体）
     *
     * @description
     * Used for real-time interactions like dragging and editing. Updates only Line2 vertex positions without destroying and rebuilding geometry.
     * This is much faster than full rebuild and keeps the feature visible during dragging.
     *
     * 用于拖拽、编辑等实时交互场景，仅更新Line2的顶点位置而不销毁重建几何体。
     * 这比完整重建快得多，并且能保持feature在拖拽过程中可见。
     */
    _refreshCoordinates() {
        // Recalculate coordinates
        let { _vertexPoints } = this._coordsTransform();
        this._vertexPoints = _vertexPoints;
        // Check if geometry is Line2 type (using isLine2 property is more reliable)
        const isLine2Type = this._renderObject &&
            (this._renderObject.isLine2 || this._renderObject instanceof Line2);
        // If geometry exists and is Line2 type, only update vertex positions (Critical: do not call _disposeGeometry)
        if (isLine2Type) {
            const line2 = this._renderObject;
            const geometry = line2.geometry;
            // Update geometry coordinates
            geometry.setPositions(this._vertexPoints);
            line2.computeLineDistances();
            // Recalculate bounding info
            geometry.computeBoundingSphere();
            geometry.computeBoundingBox();
            // Update position (relative to map center)
            const map = this.getMap();
            if (map?.prjcenter) {
                // Note: Copy directly, do not use sub or add to avoid accumulated offset
                this._renderObject.position.set(map.prjcenter.x, map.prjcenter.y, map.prjcenter.z);
            }
            // Ensure geometry is in the scene
            if (!this.children.includes(this._renderObject)) {
                this.add(this._renderObject);
            }
            // Force update matrix
            this.updateMatrixWorld(true);
            this._renderObject.updateMatrixWorld(true);
        }
        else {
            // If geometry doesn't exist or type mismatch, call full rebuild
            console.warn('[LineString] _updateGeometryPositions: Geometry type mismatch, fallback to full rebuild', {
                hasGeometry: !!this._renderObject,
                geometryType: this._renderObject?.constructor?.name,
                isLine2: this._renderObject?.isLine2
            });
            this._buildRenderObject();
        }
    }
    /**
     * Create line object.
     * 创建线对象
     *
     * @param style - Style configuration 样式配置
     * @returns Created line object 创建的线对象
     * @throws Throws error if style type is not supported 如果样式类型不支持会抛出错误
     *
     * @description
     * Currently supported style types:
     * - 'basic-line': Basic line style
     *
     * 当前支持样式类型：
     * - 'basic-line': 基础线样式
     */
    async _createObject(paint) {
        switch (paint.config.type) {
            case 'line':
                return _createBasicLine(paint.config, this._vertexPoints);
            case 'flow-tube':
                return _createFlowLine(paint.config, this._vertexPoints);
            case 'arrow':
                return _createArrowLine(paint.config, this._vertexPoints);
            case 'flow-texture':
                return await _createFlowTextureLine(paint.config, this._vertexPoints);
            default:
                throw new Error(`Unsupported style type: ${paint.config.type}`);
        }
    }
}
// 合并默认配置
LineString.mergeOptions(options);
