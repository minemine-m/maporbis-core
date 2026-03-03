import { LayerOptions, Layer } from './Layer';
import { Feature } from '../feature/Feature';
import { CollisionEngine } from '../core/collision/CollisionEngine';
/**
 * Overlay layer configuration options.
 * 覆盖图层配置选项
 * @template T Feature type inheriting from Feature. 继承自Feature的要素类型
  * @category Layer
 */
export type OverlayLayerOptions<T extends Feature> = LayerOptions & {
    /**
     * Initial features.
     * 初始要素
     */
    features?: T[];
    /**
     * Merge geometries toggle.
     * 合并几何体开关
     */
    merge?: boolean;
    /**
     * Collision detection toggle.
     * 碰撞检测开关
     */
    collision?: boolean;
};
/**
 * Base class for Layers, managing features.
 * Layer的基类，管理features
 * @abstract
 * @template T Feature type inheriting from Feature. 继承自Feature的要素类型
  * @category Layer
 */
export declare abstract class OverlayLayer<T extends Feature = Feature> extends Layer {
    private _feaList;
    _collision: boolean;
    constructor(id: string, options?: OverlayLayerOptions<T>);
    /**
     * Validation logic to be implemented by subclasses (Abstract method).
     * 子类必须实现的校验逻辑（抽象方法）
     * @param feature Feature to validate.
     *                待校验的 Feature
     * @returns Whether valid.
     *          是否合法
     */
    protected abstract validateFeature(feature: T): boolean;
    /**
     * Add Feature(s) to the layer.
     * 添加Feature到图层
     * @param features Feature instance or array of instances to add.
     *                 要添加的Feature实例或实例数组
     * @returns this
     */
    addFeature(features: T | T[]): this;
    /**
     * Get all Features.
     * 获取所有的Features
     * @param filter Filter function.
     *               过滤函数
     * @param context Filter function context.
     *                过滤函数上下文
     * @returns Filtered Feature array.
     *          过滤后的Feature数组
     */
    getFeatures(filter?: (feature: Feature) => boolean, context?: any): Array<Feature>;
    /**
     * Get number of features.
     * 获取features个数
     * @return Feature count.
     *         features数量
     */
    getCount(): number;
    /**
     * Check if layer is empty.
     * layer是否为空
     * @return Whether empty.
     *         是否为空
     */
    isEmpty(): boolean;
    /**
     * Remove one or more features.
     * 移除一个或多个features
     * @param features Feature(s) to remove.
     *                 要移除的feature或数组
     * @returns this
     */
    removeFeature(features: Feature | Feature[]): any;
    /**
     * Clear all features in the layer.
     * 清空图层中的所有要素
     * @returns this
     */
    clear(): this;
    /**
     * Handler when removing a feature.
     * 移除feature时的处理
     * @param feature Feature to remove.
     *                要移除的feature
     */
    onRemoveFeature(feature: T): void;
    /**
     * Binary search algorithm.
     * 二分查找算法
     *
     * @description
     * Requires combination with layer index.
     * 需要和图层的index结合。
     *
     * @internal
     */
    _findInList(feature: Feature): number;
    /**
     * Dispose feature resources recursively.
     * 递归释放要素资源
     *
     * @private
     */
    private _disposeFeatureResources;
    /**
     * Merge geometries (TODO).
     * 几何体合并 (待办)
     */
    _mergedGeometry(): void;
    /**
    * Set collision engine (Pluggable design).
    * 设置避让系统（可插拔设计）
    *
    * @param engine Collision engine instance. 避让引擎实例。
    */
    setCollisionEngine(engine: CollisionEngine): this;
}
