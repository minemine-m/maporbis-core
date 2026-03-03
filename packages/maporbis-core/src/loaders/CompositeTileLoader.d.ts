import { BufferGeometry, Material, Mesh } from "three";
import { ISource } from "../sources";
import { ICompositeLoader, TileLoadContext, TileMeshData } from "./LoaderInterfaces";
/**
 * 综合瓦片加载器
 * @class CompositeTileLoader
 * @description 负责协调加载瓦片的几何体 (Geometry) 和材质 (Material)
 */
export declare class CompositeTileLoader implements ICompositeLoader {
    private _imgSources;
    private _demSource;
    private _vtSource;
    manager: import("./LoaderInterfaces").TileLoadingManager;
    get imgSource(): ISource[];
    set imgSource(value: ISource[]);
    get demSource(): ISource | undefined;
    set demSource(value: ISource | undefined);
    get vtSource(): ISource | undefined;
    set vtSource(value: ISource | undefined);
    /**
     * 加载瓦片数据
     * @param context 加载上下文
     */
    load(context: TileLoadContext): Promise<TileMeshData>;
    /**
     * 卸载资源
     * @param tileMesh
     */
    unload(tileMesh: Mesh): void;
    /**
     * 加载几何体
     * @param context
     */
    protected loadGeometry(context: TileLoadContext): Promise<BufferGeometry>;
    /**
     * 加载材质列表
     * @param context
     */
    protected loadMaterials(context: TileLoadContext): Promise<Material[]>;
    private loadFromSource;
    /**
     * 检查瓦片边界是否在数据源范围内
     */
    private isBoundsInSource;
}
