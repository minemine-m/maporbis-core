import { Vector3, BufferGeometry, Points, PointsMaterial } from 'three';
import { Feature } from './Feature';
/**
 * Point feature abstract base class.
 * 点要素抽象基类
 *
 * @description
 * Represents a point feature in the 3D scene, inheriting from the Feature class.
 * Provides basic functionality for point features, including:
 * - Coordinate transformation
 * - Point geometry creation
 *
 * 表示3D场景中的点要素，继承自Feature类
 * 提供点要素的基础功能，包括：
 * - 坐标转换
 * - 点几何体创建
 *
 * @abstract
 * @extends Feature
 * @category Feature
 */
export class Point extends Feature {
    /**
     * Base type identifier.
     * 基础类型标识
     */
    _baseType = "Point";
    /**
     * Create a Point feature instance.
     * 创建点要素实例
     *
     * @param options Point feature configuration
     *                点要素配置
     */
    constructor(options) {
        super(options);
        this._renderObject = this._createRenderObject();
        if (this._paint) {
            this._paint.applyTo(this._renderObject);
        }
    }
    /**
     * Coordinate transformation method.
     * 坐标转换方法
     *
     * @returns Transformed world coordinates
     *          转换后的世界坐标
     *
     * @description
     * Converts geographic coordinates to world coordinates.
     *
     * 将地理坐标转换为世界坐标
     */
    _coordsTransform() {
        const map = this.getMap();
        const coordinates = new Vector3(this._geometry.coordinates[0], this._geometry.coordinates[1], this._geometry.coordinates[2] || 0 // Default height 500
        );
        return map ? map.lngLatToWorld(coordinates) : coordinates;
    }
    /**
     * Convert feature to Three.js geometry (abstract method).
     * 将要素转换为Three.js几何体（抽象方法）
     *
     * @abstract
     */
    async _buildRenderObject() {
        if (!this.getMap())
            return;
    }
    _refreshCoordinates() {
        // Recalculate coordinates
        const worldPos = this._coordsTransform();
        this._worldCoordinates = worldPos;
        // If geometry exists, only update position
        if (this._renderObject) {
            // Update geometry position
            const map = this.getMap();
            if (map?.prjcenter) {
                this._renderObject.position.copy(worldPos).sub(map.prjcenter);
            }
            else {
                this._renderObject.position.copy(worldPos);
            }
            // Ensure geometry is in the scene (Critical: prevent disappearance during editing)
            if (!this.children.includes(this._renderObject)) {
                this.add(this._renderObject);
            }
            // Force update matrix
            this.updateMatrixWorld(true);
        }
        else {
            // If geometry doesn't exist, call full rebuild
            this._buildRenderObject();
        }
    }
    /**
     * Create basic point geometry.
     * 创建基础点几何体
     *
     * @returns Points instance
     *          Points实例
     *
     * @protected
     * @description
     * Creates point geometry with default material. Subclasses can extend or override this method.
     *
     * 创建带有默认材质的点几何体，子类可扩展或重写此方法
     */
    _createRenderObject() {
        return new Points(new BufferGeometry(), new PointsMaterial({ size: 1, color: 0x888888 }));
    }
}
