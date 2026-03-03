import { TileLoadingManager } from "./LoaderInterfaces";
/**
 * 瓦片加载器工厂
 * @description 管理和检索各种类型的瓦片加载器 (Geometry, Material, Mesh)
 */
export class TileLoaderFactory {
    /**
     * 注册材质加载器
     * @param loader
     */
    static registerMaterialLoader(loader) {
        this.materialLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }
    /**
     * 注册几何体加载器
     * @param loader
     */
    static registerGeometryLoader(loader) {
        this.geometryLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }
    /**
     * 注册网格加载器 (通常用于矢量瓦片等自带几何体和材质的数据)
     * @param loader
     */
    static registerMeshLoader(loader) {
        this.meshLoaders.set(loader.dataType, loader);
        this.ensureAuthor(loader.info);
    }
    /**
     * 获取材质加载器
     * @param source
     */
    static getMaterialLoader(source) {
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
    static getGeometryLoader(source) {
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
    static getMeshLoader(source) {
        const loader = this.meshLoaders.get(source.dataType);
        if (!loader) {
            throw new Error(`[TileLoaderFactory] Unsupported mesh source type: "${source.dataType}"`);
        }
        return loader;
    }
    static ensureAuthor(info) {
        if (!info.author) {
            info.author = "MapOrbis"; // Default author
        }
    }
}
Object.defineProperty(TileLoaderFactory, "manager", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new TileLoadingManager()
});
// 存储加载器实例的 Map
Object.defineProperty(TileLoaderFactory, "geometryLoaders", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(TileLoaderFactory, "materialLoaders", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
Object.defineProperty(TileLoaderFactory, "meshLoaders", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
}); // 复用 IGeometryLoader 接口?
