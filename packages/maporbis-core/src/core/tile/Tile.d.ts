import { BaseEvent, BufferGeometry, Camera, Intersection, Material, Mesh, Object3DEventMap, Raycaster } from "three";
import { ICompositeLoader } from "../../loaders";
import { LODAction } from "./util";
/**
 * Tile update parameters
 */
export type TileUpdateParams = {
    camera: Camera;
    loader: ICompositeLoader;
    minLevel: number;
    maxLevel: number;
    LODThreshold: number;
};
/**
 * Tile event map
 * 瓦片事件映射
 */
export interface ITileEventMap extends Object3DEventMap {
    unload: BaseEvent;
    ready: BaseEvent;
    "tile-created": BaseEvent & {
        tile: Tile;
    };
    "tile-loaded": BaseEvent & {
        tile: Tile;
    };
    "tile-unload": BaseEvent & {
        tile: Tile;
    };
    "vector-data-loaded": BaseEvent & {
        tile: Tile;
        data: any;
    };
    "vector-tile-loaded": BaseEvent & {
        tileKey: string;
        data: any;
        tile: Tile;
    };
    "tile-hidden": BaseEvent & {
        tile: Tile;
    };
    "tile-shown": BaseEvent & {
        tile: Tile;
    };
    "vector-tile-unloaded": BaseEvent & {
        tileKey: string;
        tile: Tile;
    };
    "visible-vector-tiles-changed": BaseEvent & {
        tiles: Array<{
            tileKey: string;
            data: any;
            tile: Tile;
        }>;
    };
}
/**
 * Class Tile, inherit of Mesh
 * Tile类，继承自Mesh
 */
/**
 * Represents a tile in a 3D scene.
 * Extends the Mesh class with BufferGeometry and Material.
 * 表示3D场景中的一个瓦片。
 * 继承自带有BufferGeometry和Material的Mesh类。
 */
export declare class Tile extends Mesh<BufferGeometry, Material[], ITileEventMap> {
    private static _activeDownloads;
    private _dataMode;
    /** Vector Data 矢量数据 */
    _vectorData: any;
    /**
        * Set data only mode (do not create Mesh, only return data)
        * 设置为数据模式（不创建Mesh，只返回数据）
        */
    setDataOnlyMode(isDataOnly: boolean): this;
    /**
     * Check if it is data only mode
     * 检查是否是数据模式
      */
    isDataOnlyMode(): boolean;
    /**
     * Get vector data (only valid in data mode)
     * 获取矢量数据（仅数据模式有效）
     */
    getVectorData(): any;
    /**
     * Number of download threads.
     * 下载线程数
     */
    static get downloadThreads(): number;
    /** Coordinate of tile 瓦片坐标 */
    readonly x: number;
    readonly y: number;
    readonly z: number;
    /** Is a tile? 是否是瓦片？ */
    readonly isTile = true;
    /** Tile parent 父瓦片 */
    readonly parent: this | null;
    /** Children of tile 子瓦片 */
    readonly children: this[];
    private _isReady;
    /** return this.minLevel < map.minLevel, True mean do not needs load tile data. True表示不需要加载瓦片数据 */
    private _isVirtualTile;
    get isDummy(): boolean;
    private _isVisible;
    /**
     * Gets the showing state of the tile.
     * 获取瓦片的显示状态。
     */
    get showing(): boolean;
    /**
     * Sets the showing state of the tile.
     * 设置瓦片的显示状态。
     * @param value - The new showing state. 新的显示状态。
     */
    set showing(value: boolean);
    /** Max height of tile 瓦片最大高度 */
    private _maxHeight;
    /**
     * Gets the maximum height of the tile.
     * 获取瓦片的最大高度。
     */
    get maxZ(): number;
    /**
     * Sets the maximum height of the tile.
     * 设置瓦片的最大高度。
     * @param value - The new maximum height. 新的最大高度。
     */
    protected set maxZ(value: number);
    /** Distance to camera 到相机的距离 */
    distToCamera: number;
    sizeInWorld: number;
    /**
     * Gets the index of the tile in its parent's children array.
     * 获取瓦片在父节点子数组中的索引。
     * @returns The index of the tile. 瓦片的索引。
     */
    get index(): number;
    private _isLoaded;
    /**
     * Gets the load state of the tile.
     * 获取瓦片的加载状态。
     */
    get loaded(): boolean;
    private _inFrustum;
    /** Is tile in frustum ? 瓦片是否在视锥体中？ */
    get inFrustum(): boolean;
    /**
     * Sets whether the tile is in the frustum.
     * 设置瓦片是否在视锥体中。
     * @param value - The new frustum state. 新的视锥体状态。
     */
    protected set inFrustum(value: boolean);
    /** Tile is a leaf ? 瓦片是否是叶子节点？ */
    get isLeaf(): boolean;
    /**
     * Constructor for the Tile class.
     * Tile类的构造函数。
     * @param x - Tile X-coordinate, default: 0. 瓦片X坐标，默认0。
     * @param y - Tile Y-coordinate, default: 0. 瓦片Y坐标，默认0。
     * @param z - Tile level, default: 0. 瓦片层级，默认0。
     */
    constructor(x?: number, y?: number, z?: number);
    /**
     * Override Object3D.traverse, change the callback param type to "this".
     * 重写 Object3D.traverse，将回调参数类型更改为 "this"。
     * @param callback - The callback function. 回调函数。
     */
    traverse(callback: (object: this) => void): void;
    /**
     * Override Object3D.traverseVisible, change the callback param type to "this".
     * 重写 Object3D.traverseVisible，将回调参数类型更改为 "this"。
     * @param callback - The callback function. 回调函数。
     */
    traverseVisible(callback: (object: this) => void): void;
    /**
     * Override Object3D.raycast, only test the tile has loaded.
     * 重写 Object3D.raycast，仅测试已加载的瓦片。
     * @param raycaster - The raycaster. 射线投射器。
     * @param intersects - The array of intersections. 交点数组。
     */
    raycast(raycaster: Raycaster, intersects: Intersection[]): void;
    /**
     * LOD (Level of Detail).
     * LOD（细节层次）。
     * @param params - The tile loader. 瓦片加载器。
     * @returns this
     */
    protected _updateLOD(params: TileUpdateParams): {
        action: LODAction;
        newTiles?: undefined;
    } | {
        action: LODAction;
        newTiles: Tile[];
    };
    /**
     * Checks the visibility of the tile.
     */
    private _checkVisibility;
    /**
     * Asynchronously load tile data
     *
     * @param loader Tile loader
     * @returns this
     */
    private _loadData;
    /** New tile init */
    private _initTile;
    /**
     * Updates the tile.
     * @param params - The update parameters.
     * @returns this
     */
    update(params: TileUpdateParams): this;
    private _processLODAction;
    /**
     * Reloads the tile data.
     * @returns this
     */
    reload(loader: ICompositeLoader): this;
    /**
     * Checks if the tile is ready to render.
     * @returns this
     */
    private _checkReadyState;
    /**
     * UnLoads the tile data.
     * @param disposeSelf - Whether to unload tile itself.
     * @returns this.
     */
    private _disposeResources;
}
