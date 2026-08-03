import { BufferGeometry, Material, Mesh } from "three";
import { TileMeshData } from "./LoaderInterfaces";

/**
 * LRU Cache entry
 * LRU 缓存条目
 */
interface CacheEntry {
    data: TileMeshData;
    lastAccess: number;
}

/**
 * LRU Tile Cache
 * LRU 瓦片缓存
 * @description Caches loaded tile geometry and materials to avoid re-fetching on zoom back.
 *              Uses Least Recently Used eviction when cache is full.
 *              缓存已加载的瓦片几何体和材质，避免缩放回去时重新请求。
 *              满时使用最近最少使用策略淘汰。
 */
export class TileCache {
    private _cache: Map<string, CacheEntry> = new Map();
    private _maxSize: number;
    private _hits: number = 0;
    private _misses: number = 0;

    /**
     * Create a tile cache
     * 创建瓦片缓存
     * @param maxSize - Maximum number of tiles to cache (default 512)
     */
    constructor(maxSize: number = 512) {
        this._maxSize = maxSize;
    }

    /**
     * Generate cache key from tile coordinates
     * 从瓦片坐标生成缓存键
     */
    private _key(z: number, x: number, y: number): string {
        return `${z}-${x}-${y}`;
    }

    /**
     * Get cached tile data
     * 获取缓存的瓦片数据
     * @returns Cached data or undefined if not found
     */
    public get(z: number, x: number, y: number): TileMeshData | undefined {
        const key = this._key(z, x, y);
        const entry = this._cache.get(key);

        if (entry) {
            // Update access time 更新访问时间
            entry.lastAccess = Date.now();
            this._hits++;
            return entry.data;
        }

        this._misses++;
        return undefined;
    }

    /**
     * Store tile data in cache
     * 存储瓦片数据到缓存
     */
    public set(z: number, x: number, y: number, data: TileMeshData): void {
        const key = this._key(z, x, y);

        // If already exists, update 如果已存在，更新
        if (this._cache.has(key)) {
            this._cache.get(key)!.data = data;
            this._cache.get(key)!.lastAccess = Date.now();
            return;
        }

        // Evict if full 满时淘汰
        if (this._cache.size >= this._maxSize) {
            this._evict();
        }

        // Add new entry 添加新条目
        this._cache.set(key, {
            data,
            lastAccess: Date.now()
        });
    }

    /**
     * Check if tile is cached
     * 检查瓦片是否已缓存
     */
    public has(z: number, x: number, y: number): boolean {
        return this._cache.has(this._key(z, x, y));
    }

    /**
     * Remove tile from cache
     * 从缓存中移除瓦片
     */
    public delete(z: number, x: number, y: number): void {
        this._cache.delete(this._key(z, x, y));
    }

    /**
     * Clear all cached data
     * 清空所有缓存数据
     */
    public clear(): void {
        this._cache.clear();
    }

    /**
     * Evict least recently used entry
     * 淘汰最近最少使用的条目
     */
    private _evict(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this._cache) {
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this._cache.delete(oldestKey);
        }
    }

    /**
     * Get current cache size
     * 获取当前缓存大小
     */
    public get size(): number {
        return this._cache.size;
    }

    /**
     * Get cache hits
     * 获取缓存命中次数
     */
    public get hits(): number {
        return this._hits;
    }

    /**
     * Get cache misses
     * 获取缓存未命中次数
     */
    public get misses(): number {
        return this._misses;
    }

    /**
     * Get max cache size
     * 获取最大缓存大小
     */
    public get maxSize(): number {
        return this._maxSize;
    }

    /**
     * Set max cache size
     * 设置最大缓存大小
     */
    public set maxSize(value: number) {
        this._maxSize = value;
        // Evict if over new limit 超过新限制时淘汰
        while (this._cache.size > this._maxSize) {
            this._evict();
        }
    }

    /**
     * Get cache hit rate
     * 获取缓存命中率
     */
    public get hitRate(): number {
        const total = this._hits + this._misses;
        return total === 0 ? 0 : this._hits / total;
    }

    /**
     * Get cache stats
     * 获取缓存统计
     */
    public get stats(): { size: number; maxSize: number; hits: number; misses: number; hitRate: number } {
        return {
            size: this._cache.size,
            maxSize: this._maxSize,
            hits: this._hits,
            misses: this._misses,
            hitRate: this.hitRate
        };
    }

    /**
     * Reset stats
     * 重置统计
     */
    public resetStats(): void {
        this._hits = 0;
        this._misses = 0;
    }
}
