import { Group } from "three";
import { Layer } from "../layer/Layer"

/**
 * Layer Container Class.
 * 图层容器类
 * 
 * @description
 * A specialized container for managing multiple layers, inheriting from Three.js Group.
 * Provides management functions such as adding, removing, and finding layers.
 * 用于管理多个图层的专用容器，继承自Three.js的Group。
 * 提供图层添加、移除、查找等管理功能。
 * 
 * @extends Group
  * @category Layer
 */
export class LayerContainer extends Group {
    /** 
     * Collection of layer instances.
     * 存储图层实例的集合 
     */
    private _layers: Set<Layer> = new Set();
    /** 
     * Collection of layer IDs for fast lookup.
     * 存储图层ID的集合，用于快速查找 
     */
    private _layerids: Set<string> = new Set();

    /**
     * Add layers to the container.
     * 添加图层到容器
     * @param layers Layer instances to add.
     *               要添加的图层实例
     * @returns this
     * @throws Throws error if adding non-Layer instance or duplicate ID.
     *         如果添加非Layer实例或ID重复会抛出错误
     * 
     * @override
     */
    override add(...layers: Layer[]): this {
        layers.forEach(layer => {
            if (!(layer instanceof Layer)) {
                throw new Error("LayerContainer can only contain Layer instances! LayerContainer只能包含Layer实例!");
            }
            const layerId = layer.getId();
            if (this._layerids.has(layerId)) {
                throw new Error(`Layer with ID '${layerId}' already exists in the container! ID为'${layerId}'的图层已存在于容器中!`);
            }
            this._layers.add(layer);
            this._layerids.add(layerId);
            super.add(layer);
        });
        return this;
    }

    /**
     * Remove layers from the container.
     * 从容器移除图层
     * @param layers Layer instances to remove.
     *               要移除的图层实例
     * @returns this
     * 
     * @override
     */
    override remove(...layers: Layer[]): this {
        layers.forEach(layer => {
            this._layers.delete(layer);
            this._layerids.delete(layer.getId());
            super.remove(layer);
        });
        return this;
    }

    /**
     * Get all layers.
     * 获取所有图层
     * @returns Array of layers.
     *          图层数组
     */
    getLayers(): Layer[] {
        return Array.from(this._layers);
    }

    /**
     * Find layer by ID.
     * 根据ID查找图层
     * @param id Layer ID to find.
     *           要查找的图层ID
     * @returns Found layer instance, or undefined if not found.
     *          找到的图层实例，未找到返回undefined
     */
    getLayerById(id: string): Layer | undefined {
        for (const layer of this._layers) {
            if (layer.getId() === id) {
                return layer;
            }
        }
        return undefined;
    }

    /**
     * Clear all layers.
     * 清空所有图层
     * @returns this
     */
    clearLayers(): this {
        this._layers.clear();
        this._layerids.clear();
        super.clear();
        return this;
    }
}