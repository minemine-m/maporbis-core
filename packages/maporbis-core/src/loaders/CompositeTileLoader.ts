import { BufferGeometry, Event, Material, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
import { ISource } from "../sources";
import { ICompositeLoader, TileLoadContext, TileMeshData } from "./LoaderInterfaces";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { TileCache } from "./TileCache";
import { RetryLoader, RetryOptions } from "./RetryLoader";

/**
 * 综合瓦片加载器
 * @class CompositeTileLoader
 * @description 负责协调加载瓦片的几何体 (Geometry) 和材质 (Material)
 */
export class CompositeTileLoader implements ICompositeLoader {
    private _imgSources: ISource[] = [];
    private _demSource: ISource | undefined;
    private _vtSource: ISource | undefined;

    /** Tile cache for avoiding re-fetching 瓦片缓存，避免重复请求 */
    public cache: TileCache;

    /** Retry configuration 重试配置 */
    private _retryOptions: RetryOptions = {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 2000
    };

    public manager = TileLoaderFactory.manager;

    constructor(maxCacheSize: number = 512) {
        this.cache = new TileCache(maxCacheSize);
    }

    /** Set retry options 设置重试选项 */
    public setRetryOptions(options: RetryOptions): void {
        this._retryOptions = { ...this._retryOptions, ...options };
    }

    /** Get retry options 获取重试选项 */
    public getRetryOptions(): Readonly<RetryOptions> {
        return this._retryOptions;
    }

    /** Disable cache 禁用缓存 */
    public disableCache(): void {
        this.cache.clear();
        this.cache = null as any;
    }

    // #region Accessors
    
    public get imgSource(): ISource[] {
        return this._imgSources;
    }
    public set imgSource(value: ISource[]) {
        this._imgSources = value;
    }

    public get demSource(): ISource | undefined {
        return this._demSource;
    }
    public set demSource(value: ISource | undefined) {
        this._demSource = value;
    }

    public get vtSource(): ISource | undefined {
        return this._vtSource;
    }
    public set vtSource(value: ISource | undefined) {
        this._vtSource = value;
    }
    
    // #endregion

    /**
     * 加载瓦片数据
     * @param context 加载上下文
     */
    public async load(context: TileLoadContext): Promise<TileMeshData> {
        const { z, x, y } = context;

        // Check cache first 先检查缓存
        if (this.cache) {
            const cached = this.cache.get(z, x, y);
            if (cached) {
                return cached;
            }
        }

        const [geometry, materials] = await Promise.all([
            this.loadGeometry(context),
            this.loadMaterials(context)
        ]);

        if (geometry && materials) {
            // 为每个材质添加几何体组 (Group)
            for (let i = 0; i < materials.length; i++) {
                geometry.addGroup(0, Infinity, i);
            }

            // Store in cache 存入缓存
            if (this.cache) {
                this.cache.set(z, x, y, { geometry, materials });
            }
        }

        return { geometry, materials };
    }

    /**
     * 卸载资源
     * @param tileMesh 
     */
    public unload(tileMesh: Mesh): void {
        const materials = tileMesh.material as Material[];
        const geometry = tileMesh.geometry;

        if (Array.isArray(materials)) {
            materials.forEach(m => m.dispose());
        } else if (materials) {
            (materials as Material).dispose();
        }

        if (geometry) {
            geometry.dispose();
        }
    }

    /**
     * 加载几何体
     * @param context 
     */
    protected async loadGeometry(context: TileLoadContext): Promise<BufferGeometry> {
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
    protected async loadMaterials(context: TileLoadContext): Promise<Material[]> {
        const { z, bounds } = context;

        // 筛选有效的影像源
        const validSources = this._imgSources.filter(
            source => z >= source.minLevel && this.isBoundsInSource(source, bounds)
        );

        // 并行加载所有材质
        const materialPromises = validSources.map(async source => {
            const loader = TileLoaderFactory.getMaterialLoader(source);

            const loadWithRetry = new RetryLoader<Material>(
                async (ctx) => {
                    const material = await loader.load({ source, ...ctx });

                    // 自动资源管理
                    const disposeHandler = (evt: Event) => {
                        if (loader.unload) loader.unload(evt.target as Material);
                        (evt.target as any).removeEventListener("dispose", disposeHandler);
                    };

                    if (!(material instanceof MeshStandardMaterial)) {
                        material.addEventListener("dispose", disposeHandler);
                    }

                    return material;
                },
                this._retryOptions
            );

            try {
                return await loadWithRetry.load(context);
            } catch (err) {
                console.error(`[CompositeTileLoader] Material load failed for source ${source.dataType}:`, err);
                return new MeshStandardMaterial(); // Fallback
            }
        });

        return Promise.all(materialPromises);
    }

    private async loadFromSource(source: ISource, context: TileLoadContext, loader: any): Promise<BufferGeometry> {
        const loadWithRetry = new RetryLoader<BufferGeometry>(
            async (ctx) => {
                const geometry = await loader.load({ source, ...ctx });

                // 自动资源管理
                geometry.addEventListener("dispose", () => {
                    if (loader.unload) loader.unload(geometry);
                });

                return geometry;
            },
            this._retryOptions
        );

        try {
            return await loadWithRetry.load(context);
        } catch (err) {
            console.error(`[CompositeTileLoader] Geometry load failed for source ${source.dataType}:`, err);
            return new PlaneGeometry(); // Fallback
        }
    }

    /**
     * 检查瓦片边界是否在数据源范围内
     */
    private isBoundsInSource(source: ISource, bounds: [number, number, number, number]): boolean {
        const [minX, minY, maxX, maxY] = source._projectionBounds;
        const [bMinX, bMinY, bMaxX, bMaxY] = bounds;

        // 检查是否相交 (Intersects)
        // bounds completely outside source bounds?
        const isOutside = bMaxX < minX || bMaxY < minY || bMinX > maxX || bMinY > maxY;
        return !isOutside;
    }
}
