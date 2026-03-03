import { Object3D } from 'three';
import { LayerOptions, Layer } from './Layer';
import { Feature } from '../feature/Feature';
import { CollisionEngine } from '../core/collision/CollisionEngine';
import { WebGPUCompat } from '../utils/WebGPUCompat';
// import { SceneRenderer } from '../sceneRenderer';
// import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import { CollisionDetector } from '../core/collision';

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
    features?: T[]; // Generic constraint Feature type 泛型约束 Feature 类型
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
    // collisionBounds?: [number, number, number, number];
};

/**
 * Base class for Layers, managing features.
 * Layer的基类，管理features
 * @abstract
 * @template T Feature type inheriting from Feature. 继承自Feature的要素类型
  * @category Layer
 */
export abstract class OverlayLayer<T extends Feature = Feature> extends Layer {
    private _feaList: T[]; // Use generic constraint array type 使用泛型约束数组类型
    _collision: boolean = false;
    // _collisionDetector: CollisionDetector<T>; // Changed to protected for subclass access 改为protected以便子类访问

    constructor(id: string, options?: OverlayLayerOptions<T>) {
        super(id, options);
        this._feaList = [];
        // Initialize collision detector
        // 初始化碰撞检测器
        // this._collisionDetector = new CollisionDetector<T>();
        // Initialize collision detection
        // 初始化碰撞检测
        // Apply option settings
        // 应用选项设置
        if (options?.collision) {
            this._collision = true;
        }
    }

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
    addFeature(features: T | T[]): this {
        const featuresArray = Array.isArray(features) ? features : [features];

        for (const feature of featuresArray) {
            if (!feature || !(feature instanceof Feature)) continue;
            if (feature.getLayer()) continue;

            // Call validation method implemented by subclass
            // 调用子类实现的校验方法
            if (!this.validateFeature(feature)) {
                console.error(`Feature ${feature.id} does not match the layer's type requirements`);
                continue;
            }

            feature._bindLayer(this as unknown as OverlayLayer<Feature>);
            this._feaList.push(feature);
            // Add to collision detector
            // 添加到碰撞检测器
            // if (this._collisionDetector.enabled) {
            //     this._collisionDetector.addFeature(feature);
            // }


            if (feature.getMap()) {
                feature._buildRenderObject();
            } else {
                console.warn('[OverlayLayer.addFeature] Skipping _buildRenderObject - no map!');
            }
            // debugger
            if ((this as any)._clouds) {
                this.map.sceneRenderer.scene.add((this as any)._clouds);
                // console.log('我是云朵被添加cloud', this.map.sceneRenderer.scene)
                // this._clouds.add(feature._renderObject);
                // console.log( this._clouds,'我是云朵被添加')
            }
            // console.log(feature, '测试灯光 ----------- ')
            this.add(feature);
        }

        return this;
    }

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
    getFeatures(filter?: (feature: Feature) => boolean, context?: any): Array<Feature> {
        if (!filter) {
            return this._feaList.slice(0);
        }
        const result = [];
        let geometry, filtered;
        for (let i = 0, l = this._feaList.length; i < l; i++) {
            geometry = this._feaList[i];
            if (context) {
                filtered = filter.call(context, geometry);
            } else {
                filtered = filter(geometry);
            }
            if (filtered) {
                result.push(geometry);
            }
        }
        return result;
    }

    /**
     * Get number of features.
     * 获取features个数
     * @return Feature count.
     *         features数量
     */
    getCount(): number {
        return this._feaList.length;
    }

    /**
     * Check if layer is empty.
     * layer是否为空
     * @return Whether empty.
     *         是否为空
     */
    isEmpty(): boolean {
        return !this._feaList.length;
    }

    /**
     * Remove one or more features.
     * 移除一个或多个features
     * @param features Feature(s) to remove.
     *                 要移除的feature或数组
     * @returns this
     */
    removeFeature(features: Feature | Feature[]): any {
        if (!Array.isArray(features)) {
            return this.removeFeature([features]);
        }
        for (let i = features.length - 1; i >= 0; i--) {
            if (!(features[i] instanceof Feature)) {
                features[i] = this.removeFeature(features[i]);
            }
            if (!features[i] || this as unknown as OverlayLayer<Feature> !== features[i].getLayer()) continue;
            features[i]._remove();
        }
        return this;
    }

    /**
     * Clear all features in the layer.
     * 清空图层中的所有要素
     * @returns this
     */
    clear(): this {
        //  ------
        const features = this._feaList.slice();
        for (const fea of features) {
            fea._remove();
        }
        // onRemoveFeature will maintain _feaList clean during _remove -> _unbind process
        // onRemoveFeature 会在 _remove -> _unbind 过程中
        // 把 _feaList 维护干净，这里不需要再手动清空
        return this;
    }

    /**
     * Handler when removing a feature.
     * 移除feature时的处理
     * @param feature Feature to remove.
     *                要移除的feature
     */
    onRemoveFeature(feature: T) {
        if (!feature) return;

        // Check if feature belongs to this layer
        // 检查feature是否属于该图层
        // Add type guard
        // 添加类型保护
        const layer = feature.getLayer();
        if (!layer || layer !== this as unknown as OverlayLayer<Feature>) {
            return;
        }

        // Remove from list
        // 从列表中移除
        const idx = this._findInList(feature);
        if (idx >= 0) {
            this._feaList.splice(idx, 1);
        }
        // Remove from collision detector
        // 从碰撞检测器移除
        // if (this._collisionDetector.enabled) {
        //     this._collisionDetector.removeFeature(feature);
        // }

        // Safely remove from parent
        // 安全地从父级移除
        if (feature.parent === this) {
            this.remove(feature);
        } else if (feature.parent) {
            // console.warn("Feature parent mismatch:", feature.parent);
        }

        // Safely dispose resources
        // 安全释放资源
        this._disposeFeatureResources(feature);
    }

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
    _findInList(feature: Feature): number {
        // console.log(feature, 'Execute find method 执行了查找方法');
        const len = this._feaList.length;
        if (len === 0) {
            return -1;
        }
        // this._sortGeometries();
        let low = 0,
            high = len - 1,
            middle;
        while (low <= high) {
            middle = Math.floor((low + high) / 2);
            if (this._feaList[middle] === feature) {
                return middle;
            } else {
                low = middle + 1;
            }
        }
        return -1;
    }

    /**
     * Dispose feature resources recursively.
     * 递归释放要素资源
     * 
     * @private
     */
    private _disposeFeatureResources(feature: Feature) {
        const disposeLogic = () => {
            try {
                // Dispose geometry
                // 处理几何体
                if (feature.geometry && feature.geometry.dispose) {
                    feature.geometry.dispose();
                    // console.log('Execute geometry dispose method 执行了geometry的释放方法');
                }

                // Dispose material
                // 处理材质
                if (feature.material) {
                    if (Array.isArray(feature.material)) {
                        feature.material.forEach(mat => mat.dispose?.());
                    } else if (feature.material.dispose) {
                        feature.material.dispose();
                        // console.log('Execute material dispose method 执行了材质的释放方法');
                    }
                }

                // Handle nested Object3D
                // 处理嵌套的Object3D
                if (feature instanceof Object3D) {
                    feature.traverse(child => {
                        if (child !== feature) { // Avoid duplicate processing 避免重复处理
                            this._disposeFeatureResources(child as any);
                        }
                    });
                }
            } catch (e) {
                console.error('Error disposing feature resources:', e);
            }
        };

        WebGPUCompat.safeDispose(disposeLogic);
    }
    // override animate(delta: number, elapsedtime: number, context: SceneRenderer) {

    //     if (this._collision) {
    //         // Update collision system 更新避让系统
    //         console.log('Update collision system 更新避让系统了', delta, elapsedtime);
    //         this.collisionEngine.update(context.camera);
    //     }
    // }

    /**
     * Merge geometries (TODO).
     * 几何体合并 (待办)
     */
    _mergedGeometry() {

        this.traverse((child: any) => {
            // Filter out Mesh objects and ensure they have geometry and material
            // 筛选出 Mesh 对象，并确保其具有几何体和材质
            if (child.isMesh && child.geometry && child.material) {
                // console.log('Merging geometry 几何体合并中', child);
            }
        });
    }

    // *=== Collision Detection Related ===*
    // *=== 碰撞检测相关 ===*

    /**
    * Set collision engine (Pluggable design).
    * 设置避让系统（可插拔设计）
    * 
    * @param engine Collision engine instance. 避让引擎实例。
    */
    setCollisionEngine(engine: CollisionEngine): this {
        this._collisionEngine = engine;
        return this;
    }
}

// OverlayLayer.mergeOptions({});