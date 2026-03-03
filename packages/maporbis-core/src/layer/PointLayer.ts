import { OverlayLayerOptions, OverlayLayer } from './OverlayLayer';
import { Point } from '../feature/Point';

/**
 * Point Layer configuration options.
 * 点图层配置选项
 * @extends OverlayLayerOptions<Point>
  * @category Layer
 */
export type PointLayerOptions = OverlayLayerOptions<Point> & {
    // Can add PointLayer specific configurations, e.g.:
    // 可以添加 PointLayer 特有的配置项，例如：
    // pointStyle?: {
    //     color?: string;
    //     size?: number;
    // };
};

/**
 * Point Feature Layer class.
 * 点要素图层类
 * @description 
 * Specialized layer for managing Point features.
 * 用于管理点要素的专用图层。
 * @extends OverlayLayer<Point>
 * @category Layer
 */
export class PointLayer extends OverlayLayer<Point> {
    /**
     * Constructor.
     * 构造函数
     * @param id Layer ID.
     *           图层ID
     * @param options Layer configuration options.
     *                图层配置选项
     */
    constructor(id: string, options?: PointLayerOptions) {
        super(id, options);
    }

    /**
     * Validate if feature belongs to this layer.
     * 验证要素是否属于此图层
     * @param feature Point feature to validate.
     *                要验证的点要素
     * @returns Whether it is a valid Point feature.
     *          是否为合法的点要素
     * @override
     */
    protected validateFeature(feature: Point): boolean {
        // Subclass custom validation logic (with generic type hinting)
        // 子类自定义校验逻辑（同时享受泛型类型提示）
        return feature._baseType === 'Point'; //
    }
}