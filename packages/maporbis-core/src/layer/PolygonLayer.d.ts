import { OverlayLayerOptions, OverlayLayer } from './OverlayLayer';
import { Polygon } from '../feature/Polygon';
/**
 * Polygon Layer configuration options.
 * 多边形图层配置选项
 * @extends OverlayLayerOptions<Polygon>
 * @description
 * Extends basic layer options, can add Polygon specific configurations.
 * 扩展基础图层选项，可添加多边形特有的配置项。
  * @category Layer
 */
export type PolygonLayerOptions = OverlayLayerOptions<Polygon> & {};
/**
 * Polygon Feature Layer class.
 * 多边形要素图层类
 * @description
 * Specialized layer for managing Polygon features.
 * 用于管理多边形要素的专用图层。
 * @extends OverlayLayer<Polygon>
 * @category Layer
 */
export declare class PolygonLayer extends OverlayLayer<Polygon> {
    /**
     * Constructor.
     * 构造函数
     * @param id Layer unique identifier.
     *           图层唯一标识符
     * @param options Polygon layer configuration options.
     *                多边形图层配置选项
     */
    constructor(id: string, options?: PolygonLayerOptions);
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
    protected validateFeature(feature: Polygon): boolean;
}
