import { MeshBasicMaterial, PlaneGeometry } from "three";
import { TileLoaderFactory } from "./TileLoaderFactory";
/**
 * 综合瓦片加载器
 * @class CompositeTileLoader
 * @description 负责协调加载瓦片的几何体 (Geometry) 和材质 (Material)
 */
export class CompositeTileLoader {
    _imgSources = [];
    _demSource;
    _vtSource;
    manager = TileLoaderFactory.manager;
    // #region Accessors
    get imgSource() {
        return this._imgSources;
    }
    set imgSource(value) {
        this._imgSources = value;
    }
    get demSource() {
        return this._demSource;
    }
    set demSource(value) {
        this._demSource = value;
    }
    get vtSource() {
        return this._vtSource;
    }
    set vtSource(value) {
        this._vtSource = value;
    }
    // #endregion
    /**
     * 加载瓦片数据
     * @param context 加载上下文
     */
    async load(context) {
        const [geometry, materials] = await Promise.all([
            this.loadGeometry(context),
            this.loadMaterials(context)
        ]);
        if (geometry && materials) {
            // 为每个材质添加几何体组 (Group)
            // 这允许几何体使用多个材质 (Multi-material)
            // 但对于地形瓦片，通常是一个 PlaneGeometry，这里似乎是将整个几何体分配给每个材质？
            // 原代码逻辑: geometry.addGroup(0, Infinity, i);
            // 这意味着整个几何体被渲染多次？或者只是为了分配材质索引？
            // Three.js 中，如果 geometry 有 groups，则 material 可以是数组。
            // 每个 group 对应 material 数组中的一个材质。
            // 如果 groups 重叠 (0 to Infinity)，则会重复渲染。
            // 地形叠加层通常使用 Multi-texture shader 或多重 Pass。
            // 这里原代码似乎是简单的叠加渲染 (Multiple Draw Calls via Groups)。
            for (let i = 0; i < materials.length; i++) {
                geometry.addGroup(0, Infinity, i);
            }
        }
        return { geometry, materials };
    }
    /**
     * 卸载资源
     * @param tileMesh
     */
    unload(tileMesh) {
        const materials = tileMesh.material;
        const geometry = tileMesh.geometry;
        if (Array.isArray(materials)) {
            materials.forEach(m => m.dispose());
        }
        else if (materials) {
            materials.dispose();
        }
        if (geometry) {
            geometry.dispose();
        }
    }
    /**
     * 加载几何体
     * @param context
     */
    async loadGeometry(context) {
        const { z, bounds } = context;
        // 1. 尝试从 DEM 源加载
        if (this.demSource && z >= this.demSource.minLevel && this.isBoundsInSource(this.demSource, bounds)) {
            return this.loadFromSource(this.demSource, context, TileLoaderFactory.getGeometryLoader(this.demSource));
        }
        // 2. 尝试从 矢量瓦片 源加载
        else if (this.vtSource && z >= this.vtSource.minLevel && this.isBoundsInSource(this.vtSource, bounds)) {
            // 矢量瓦片可能返回几何体?
            return this.loadFromSource(this.vtSource, context, TileLoaderFactory.getMeshLoader(this.vtSource));
        }
        // 3. 默认返回平面
        return new PlaneGeometry();
    }
    /**
     * 加载材质列表
     * @param context
     */
    async loadMaterials(context) {
        const { z, bounds } = context;
        // 筛选有效的影像源
        const validSources = this._imgSources.filter(source => z >= source.minLevel && this.isBoundsInSource(source, bounds));
        // 并行加载所有材质
        const materialPromises = validSources.map(async (source) => {
            const loader = TileLoaderFactory.getMaterialLoader(source);
            try {
                const material = await loader.load({ source, ...context });
                // 自动资源管理
                const disposeHandler = (evt) => {
                    if (loader.unload)
                        loader.unload(evt.target);
                    evt.target.removeEventListener("dispose", disposeHandler);
                };
                // MeshBasicMaterial 是 Three.js 内置的，可能不需要特殊卸载逻辑？
                // 原代码排除了 MeshBasicMaterial。
                if (!(material instanceof MeshBasicMaterial)) {
                    material.addEventListener("dispose", disposeHandler);
                }
                return material;
            }
            catch (err) {
                console.error(`[CompositeTileLoader] Material load failed for source ${source.dataType}:`, err);
                return new MeshBasicMaterial(); // Fallback
            }
        });
        return Promise.all(materialPromises);
    }
    async loadFromSource(source, context, loader) {
        try {
            const geometry = await loader.load({ source, ...context });
            // 自动资源管理
            geometry.addEventListener("dispose", () => {
                if (loader.unload)
                    loader.unload(geometry);
            });
            return geometry;
        }
        catch (err) {
            console.error(`[CompositeTileLoader] Geometry load failed for source ${source.dataType}:`, err);
            return new PlaneGeometry(); // Fallback
        }
    }
    /**
     * 检查瓦片边界是否在数据源范围内
     */
    isBoundsInSource(source, bounds) {
        const [minX, minY, maxX, maxY] = source._projectionBounds;
        const [bMinX, bMinY, bMaxX, bMaxY] = bounds;
        // 检查是否相交 (Intersects)
        // bounds completely outside source bounds?
        const isOutside = bMaxX < minX || bMaxY < minY || bMinX > maxX || bMinY > maxY;
        return !isOutside;
    }
}
