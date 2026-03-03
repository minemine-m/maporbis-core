import { OverlayLayer } from './OverlayLayer';
/**
 * Line Layer class.
 * 线图层类
 *
 * @description
 * Specialized layer for managing Line features, inheriting from OverlayLayer base class.
 * Provides functions for adding, removing, and rendering line features.
 * 用于管理线要素的专用图层，继承自OverlayLayer基类。
 * 提供线要素的添加、删除、渲染等功能。
 *
 * @extends OverlayLayer<Line>
 * @category Layer
 */
export class LineLayer extends OverlayLayer {
    /**
     * Constructor.
     * 构造函数
     * @param id Layer unique identifier.
     *           图层唯一标识符
     * @param options Line layer configuration options.
     *                线图层配置选项
     */
    constructor(id, options) {
        super(id, options);
    }
    /**
     * Validate if feature belongs to this layer.
     * 验证要素是否属于此图层
     * @param feature Line feature to validate.
     *                要验证的线要素
     * @returns Whether it is a valid Line feature.
     *          是否为合法的线要素
     *
     * @description
     * Implement parent abstract method, check if feature base type is 'Line'.
     * 实现父类抽象方法，检查要素的基础类型是否为'Line'。
     * @override
     */
    validateFeature(feature) {
        return feature._baseType === 'Line';
    }
}
