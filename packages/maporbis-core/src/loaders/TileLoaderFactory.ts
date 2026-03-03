import { ISource } from "../sources";
import { IGeometryLoader, IMaterialLoader, LoaderMetadata, TileLoadingManager } from "./LoaderInterfaces";

/**
 * 瓦片加载器工厂
 * @description 管理和检索各种类型的瓦片加载器 (Geometry, Material, Mesh)
 */
export class TileLoaderFactory {
    public static readonly manager = new TileLoadingManager();

    // 存储加载器实例的 Map
    private static readonly geometryLoaders = new Map<string, IGeometryLoader>();
    private static readonly materialLoaders = new Map<string, IMaterialLoader>();
    private static readonly meshLoaders = new Map<string, IGeometryLoader>(); // 复用 IGeometryLoader 接口?

    /**
     * 注册材质加载器
     * @param loader 
     */
    public static registerMaterialLoader(loader: IMaterialLoader) {
        this.materialLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }

    /**
     * 注册几何体加载器
     * @param loader 
     */
    public static registerGeometryLoader(loader: IGeometryLoader) {
        this.geometryLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }

    /**
     * 注册网格加载器 (通常用于矢量瓦片等自带几何体和材质的数据)
     * @param loader 
     */
    public static registerMeshLoader(loader: IGeometryLoader) {
        this.meshLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }

    /**
     * 获取材质加载器
     * @param source 
     */
    public static getMaterialLoader(source: ISource): IMaterialLoader {
        const loader = this.materialLoaders.get(source.dataType);
        if (!loader) {
            throw new Error(`[TileLoaderFactory] Unsupported material source type: "${source.dataType}"`);
        }
        return loader;
    }

    /**
     * 获取几何体加载器
     * @param source 
     */
    public static getGeometryLoader(source: ISource): IGeometryLoader {
        const loader = this.geometryLoaders.get(source.dataType);
        if (!loader) {
            throw new Error(`[TileLoaderFactory] Unsupported geometry source type: "${source.dataType}"`);
        }
        return loader;
    }

    /**
     * 获取网格加载器
     * @param source 
     */
    public static getMeshLoader(source: ISource): IGeometryLoader {
        const loader = this.meshLoaders.get(source.dataType);
        if (!loader) {
            throw new Error(`[TileLoaderFactory] Unsupported mesh source type: "${source.dataType}"`);
        }
        return loader;
    }

    private static ensureAuthor(info: LoaderMetadata) {
        if (!info.author) {
            info.author = "MapOrbis"; // Default author
        }
    }
}
