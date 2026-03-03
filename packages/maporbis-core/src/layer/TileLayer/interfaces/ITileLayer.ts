// interfaces/ITileLayer.ts
import { Camera, Vector3 } from "three";
import { ISource } from "../../../sources";
import { MapProjection as IProjection } from "../../../projection";
import { IGeometryLoader, ICompositeLoader } from "../../../loaders";
import { Layer } from "../../Layer";
/**
 * Base interface for Tile Layer.
 * 瓦片图层基础接口
 * 
 * @description 
 * Defines basic contract for layers, without specific implementation.
 * 定义图层的基本契约，不包含具体实现。
  * @category Layer
 */
export interface ITileLayer extends Layer {
    /** 
     * Layer unique identifier.
     * 图层唯一标识 
     */
    // private _id: string;

    /** 
     * Layer name.
     * 图层名称。
     */
    name: string;

    /** 
     * Whether enabled.
     * 是否启用。
     */
    enabled: boolean;

    /** 
     * Whether visible.
     * 是否可见。
     */
    visible: boolean;

    /** 
     * Layer type identifier.
     * 图层类型标识。
     * @readonly
     */
    readonly layerType: string;

    /** 
     * Data source - Layer data foundation.
     * 数据源 - 图层的数据基础。
     * @readonly
     */
    readonly source: ISource | ISource[];

    /** 
     * Projection system - Layer coordinate foundation.
     * 投影系统 - 图层的坐标基础。
     * @readonly
     */
    readonly projection: IProjection;

    /**
     * Loader reference.
     * 加载器引用。
     * @readonly
     */
    readonly loader: ICompositeLoader | IGeometryLoader; 

    /** 
     * Minimum display level.
     * 最小显示层级。
     */
    minLevel: number;

    /** 
     * Maximum display level.
     * 最大显示层级。
     */
    maxLevel: number;

    /** 
     * Update layer.
     * 更新图层。
     * 
     * @param camera The camera used for rendering. 用于渲染的相机。
     */
    update(camera: Camera): void;

    /** 
     * Dispose resources.
     * 释放资源。
     */
    dispose(): void;

    /** 
     * Reload data.
     * 重新加载数据。
     */
    reload(): void;

    /** 
     * Local coordinates to world coordinates.
     * 本地坐标转世界坐标。
     * 
     * @param localPos Local position vector. 本地位置向量。
     * @returns {Vector3} World position vector. 世界位置向量。
     */
    localToWorld(localPos: Vector3): Vector3;
}