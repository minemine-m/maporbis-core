import { OverlayLayer } from './OverlayLayer';
/**
 * Polygon Feature Layer class.
 * 多边形要素图层类
 * @description
 * Specialized layer for managing Polygon features.
 * 用于管理多边形要素的专用图层。
 * @extends OverlayLayer<Polygon>
 * @category Layer
 */
export class PolygonLayer extends OverlayLayer {
    /**
     * Constructor.
     * 构造函数
     * @param id Layer unique identifier.
     *           图层唯一标识符
     * @param options Polygon layer configuration options.
     *                多边形图层配置选项
     */
    constructor(id, options) {
        super(id, options);
    }
    /**
     * Validate if feature belongs to this layer.
     * 验证要素是否属于此图层
     * @param feature Polygon feature to validate.
     *                要验证的多边形要素
     * @returns Whether it is a valid Polygon feature.
     *          是否为合法的多边形要素
     * @override
     * @description
     * Check if feature base type is 'Surface'.
     * 检查要素的基础类型是否为'Surface'。
     */
    validateFeature(feature) {
        // Subclass custom validation logic (with generic type hinting)
        // 子类自定义校验逻辑（同时享受泛型类型提示）
        return feature._baseType === 'Surface'; //
    }
}
