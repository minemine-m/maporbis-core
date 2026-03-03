import { ISource } from "../sources";
import { IGeometryLoader, IMaterialLoader, TileLoadingManager } from "./LoaderInterfaces";
/**
 * 瓦片加载器工厂
 * @description 管理和检索各种类型的瓦片加载器 (Geometry, Material, Mesh)
 */
export declare class TileLoaderFactory {
    static readonly manager: TileLoadingManager;
    private static readonly geometryLoaders;
    private static readonly materialLoaders;
    private static readonly meshLoaders;
    /**
     * 注册材质加载器
     * @param loader
     */
    static registerMaterialLoader(loader: IMaterialLoader): void;
    /**
     * 注册几何体加载器
     * @param loader
     */
    static registerGeometryLoader(loader: IGeometryLoader): void;
    /**
     * 注册网格加载器 (通常用于矢量瓦片等自带几何体和材质的数据)
     * @param loader
     */
    static registerMeshLoader(loader: IGeometryLoader): void;
    /**
     * 获取材质加载器
     * @param source
     */
    static getMaterialLoader(source: ISource): IMaterialLoader;
    /**
     * 获取几何体加载器
     * @param source
     */
    static getGeometryLoader(source: ISource): IGeometryLoader;
    /**
     * 获取网格加载器
     * @param source
     */
    static getMeshLoader(source: ISource): IGeometryLoader;
    private static ensureAuthor;
}
