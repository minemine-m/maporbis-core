import { Box3, Frustum, InstancedBufferGeometry, Matrix4, Mesh, Vector3, } from "three";
import { createChildren, getDistance, getTileSize, LODAction, LODEvaluate } from "./util";
const THREADSNUM = 10;
// Default geometry of tile
const defaultGeometry = new InstancedBufferGeometry();
// const defaultGeometry = new SphereGeometry( 0.3, 32, 16 );
const tempVec3 = new Vector3();
const tempMat4 = new Matrix4();
const tileBox = new Box3(new Vector3(-0.5, -0.5, 0), new Vector3(0.5, 0.5, 1));
const frustum = new Frustum();
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
export class Tile extends Mesh {
    /**
        * Set data only mode (do not create Mesh, only return data)
        * 设置为数据模式（不创建Mesh，只返回数据）
        */
    setDataOnlyMode(isDataOnly) {
        this._dataMode = isDataOnly;
        if (isDataOnly) {
            this.visible = false; // Hide Mesh 隐藏Mesh
        }
        return this;
    }
    /**
     * Check if it is data only mode
     * 检查是否是数据模式
      */
    isDataOnlyMode() {
        return this._dataMode;
    }
    /**
     * Get vector data (only valid in data mode)
     * 获取矢量数据（仅数据模式有效）
     */
    getVectorData() {
        return this._vectorData;
    }
    /**
     * Number of download threads.
     * 下载线程数
     */
    static get downloadThreads() {
        return Tile._activeDownloads;
    }
    get isDummy() {
        return this._isVirtualTile;
    }
    // private _wasShowing = false; // Record last showing value 记录上一次 showing 的值
    /**
     * Gets the showing state of the tile.
     * 获取瓦片的显示状态。
     */
    get showing() {
        return this._isVisible;
    }
    /**
     * Sets the showing state of the tile.
     * 设置瓦片的显示状态。
     * @param value - The new showing state. 新的显示状态。
     */
    set showing(value) {
        const oldValue = this._isVisible;
        this._isVisible = value;
        this.material.forEach(mat => (mat.visible = value));
        // 🔥 Critical Fix: When tile changes from hidden to shown, if loaded but not rendered, trigger render
        // 🔥 关键修复：当瓦片从隐藏变为显示时，如果已加载但未渲染，触发渲染
        if (oldValue === false && this._isVisible === true && this._isLoaded) {
            // Trigger an event to notify VectorTileLayer to check and render this tile
            // 触发一个事件，通知 VectorTileLayer 检查并渲染这个瓦片
            // console.log('Tile shown', this.z, this.x, this.y);
            this.dispatchEvent({ type: "tile-shown", tile: this });
        }
        // 🔥 When tile changes from shown to hidden, trigger tile-hidden event
        // 🔥 当瓦片从显示变为隐藏时，触发 tile-hidden 事件
        if (oldValue === true && this._isVisible === false) {
            // console.log('Tile hidden', this.z, this.x, this.y);
            this.dispatchEvent({ type: "tile-hidden", tile: this });
        }
    }
    /**
     * Gets the maximum height of the tile.
     * 获取瓦片的最大高度。
     */
    get maxZ() {
        return this._maxHeight;
    }
    /**
     * Sets the maximum height of the tile.
     * 设置瓦片的最大高度。
     * @param value - The new maximum height. 新的最大高度。
     */
    set maxZ(value) {
        this._maxHeight = value;
    }
    /**
     * Gets the index of the tile in its parent's children array.
     * 获取瓦片在父节点子数组中的索引。
     * @returns The index of the tile. 瓦片的索引。
     */
    get index() {
        return this.parent ? this.parent.children.indexOf(this) : -1;
    }
    /**
     * Gets the load state of the tile.
     * 获取瓦片的加载状态。
     */
    get loaded() {
        return this._isLoaded;
    }
    /** Is tile in frustum ? 瓦片是否在视锥体中？ */
    get inFrustum() {
        return this._inFrustum;
    }
    /**
     * Sets whether the tile is in the frustum.
     * 设置瓦片是否在视锥体中。
     * @param value - The new frustum state. 新的视锥体状态。
     */
    set inFrustum(value) {
        this._inFrustum = value;
    }
    /** Tile is a leaf ? 瓦片是否是叶子节点？ */
    get isLeaf() {
        return this.children.filter(child => child.isTile).length === 0;
    }
    /**
     * Constructor for the Tile class.
     * Tile类的构造函数。
     * @param x - Tile X-coordinate, default: 0. 瓦片X坐标，默认0。
     * @param y - Tile Y-coordinate, default: 0. 瓦片Y坐标，默认0。
     * @param z - Tile level, default: 0. 瓦片层级，默认0。
     */
    constructor(x = 0, y = 0, z = 0) {
        super(defaultGeometry, []);
        // Data mode switch 数据模式开关
        Object.defineProperty(this, "_dataMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Vector Data 矢量数据 */
        Object.defineProperty(this, "_vectorData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Coordinate of tile 瓦片坐标 */
        Object.defineProperty(this, "x", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "y", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "z", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Is a tile? 是否是瓦片？ */
        Object.defineProperty(this, "isTile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        /** Tile parent 父瓦片 */
        Object.defineProperty(this, "parent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** Children of tile 子瓦片 */
        Object.defineProperty(this, "children", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "_isReady", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** return this.minLevel < map.minLevel, True mean do not needs load tile data. True表示不需要加载瓦片数据 */
        Object.defineProperty(this, "_isVirtualTile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_isVisible", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** Max height of tile 瓦片最大高度 */
        Object.defineProperty(this, "_maxHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        /** Distance to camera 到相机的距离 */
        Object.defineProperty(this, "distToCamera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        /* Tile size in world 世界空间中的瓦片大小 */
        Object.defineProperty(this, "sizeInWorld", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_isLoaded", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_inFrustum", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.x = x;
        this.y = y;
        this.z = z;
        this.name = `Tile ${z}-${x}-${y}`;
        this.up.set(0, 0, 1);
        this.matrixAutoUpdate = false;
        // Ensure tiles are rendered before other overlays (like polygons) to avoid transparency sorting issues
        // 确保瓦片在其他覆盖物（如多边形）之前渲染，以避免透明度排序问题
        this.renderOrder = -1;
    }
    /**
     * Override Object3D.traverse, change the callback param type to "this".
     * 重写 Object3D.traverse，将回调参数类型更改为 "this"。
     * @param callback - The callback function. 回调函数。
     */
    traverse(callback) {
        callback(this);
        this.children.forEach(tile => {
            tile.isTile && tile.traverse(callback);
        });
    }
    /**
     * Override Object3D.traverseVisible, change the callback param type to "this".
     * 重写 Object3D.traverseVisible，将回调参数类型更改为 "this"。
     * @param callback - The callback function. 回调函数。
     */
    traverseVisible(callback) {
        if (this.visible) {
            callback(this);
            this.children.forEach(tile => {
                tile.isTile && tile.traverseVisible(callback);
            });
        }
    }
    /**
     * Override Object3D.raycast, only test the tile has loaded.
     * 重写 Object3D.raycast，仅测试已加载的瓦片。
     * @param raycaster - The raycaster. 射线投射器。
     * @param intersects - The array of intersections. 交点数组。
     */
    raycast(raycaster, intersects) {
        if (this.showing && this.loaded && this.isTile) {
            super.raycast(raycaster, intersects);
        }
    }
    /**
     * LOD (Level of Detail).
     * LOD（细节层次）。
     * @param params - The tile loader. 瓦片加载器。
     * @returns this
     */
    _updateLOD(params) {
        if (Tile.downloadThreads > THREADSNUM) {
            return { action: LODAction.none };
        }
        let newTiles = [];
        // LOD evaluate
        const { loader, minLevel, maxLevel, LODThreshold } = params;
        const action = LODEvaluate(this, minLevel, maxLevel, LODThreshold);
        if (action === LODAction.create) {
            newTiles = createChildren(loader, this.x, this.y, this.z);
            this.add(...newTiles);
        }
        return { action, newTiles };
    }
    /**
     * Checks the visibility of the tile.
     */
    _checkVisibility() {
        const parent = this.parent;
        if (parent && parent.isTile) {
            const children = parent.children.filter(child => child.isTile);
            const allLoaded = children.every(child => child.loaded);
            parent.showing = !allLoaded;
            children.forEach(child => (child.showing = allLoaded));
        }
        return this;
    }
    /**
     * Asynchronously load tile data
     *
     * @param loader Tile loader
     * @returns this
     */
    async _loadData(loader) {
        Tile._activeDownloads++;
        const { x, y, z } = this;
        // 如果是数据模式，只获取数据不创建Mesh
        if (this._dataMode) {
            try {
                // 调用加载器获取数据
                const meshData = await loader.load({
                    x, y, z,
                    bounds: [-Infinity, -Infinity, Infinity, Infinity],
                });
                this._vectorData = meshData.geometry?.userData || {};
                this._isLoaded = true;
                // 触发数据加载事件
                this.dispatchEvent({
                    type: "vector-data-loaded",
                    data: this._vectorData,
                    tile: this
                });
            }
            catch (error) {
                console.error(`数据模式加载失败 ${z}/${x}/${y}:`, error);
                this._isLoaded = false;
            }
        }
        else {
            const meshData = await loader.load({
                x,
                y,
                z,
                bounds: [-Infinity, -Infinity, Infinity, Infinity],
            });
            this.material = meshData.materials;
            // this.material = [new MeshPhongMaterial({
            // 	color: 0xFF0000,
            // 	flatShading: true,
            // 	side: DoubleSide,
            // })];
            this.geometry = meshData.geometry;
            this.maxZ = this.geometry.boundingBox?.max.z || 0;
            this._isLoaded = true;
        }
        Tile._activeDownloads--;
        // this._checkVisibility();
        return this;
    }
    /** New tile init */
    _initTile() {
        this.updateMatrix();
        this.updateMatrixWorld();
        this.sizeInWorld = getTileSize(this);
        // 添加调试信息
        // console.log(`瓦片 ${this.z}-${this.x}-${this.y} 变换矩阵:`, {
        // 	position: this.position.toArray(),
        // 	scale: this.scale.toArray(),
        // 	rotation: this.rotation.toArray(),
        // 	matrix: this.matrix.toArray(),
        // 	matrixWorld: this.matrixWorld.toArray()
        // });
    }
    /**
     * Updates the tile.
     * @param params - The update parameters.
     * @returns this
     */
    update(params) {
        console.assert(this.z === 0);
        // console.log(`Tile.update called for root tile ${this.name}, parent exists: ${!!this.parent}`);
        if (!this.parent) {
            return this;
        }
        // console.log("camera:", camera);
        // Get camera frustum
        frustum.setFromProjectionMatrix(tempMat4.multiplyMatrices(params.camera.projectionMatrix, params.camera.matrixWorldInverse));
        // console.log(params.camera, '此时更新的camera -------------')
        // Get camera position
        const cameraWorldPosition = params.camera.getWorldPosition(tempVec3);
        // LOD for tiles
        this.traverse(tile => {
            // shadow
            tile.receiveShadow = this.receiveShadow;
            tile.castShadow = this.castShadow;
            // Tile is in frustum?
            // const bounds = tileBox.clone().applyMatrix4(tile.matrixWorld);
            // bounds.max.setY(9000);
            // 修复视锥体检测
            const bounds = tileBox.clone().applyMatrix4(tile.matrixWorld);
            // 根据瓦片的最大高度动态设置包围盒
            // bounds.max.z = tile.maxZ > 0 ? tile.maxZ : 100; // 默认给一个较小的高度
            // tile.inFrustum = frustum.intersectsBox(bounds);
            // const bounds = new Box3(new Vector3(-0.5, -0.5, 0), new Vector3(0.5, 0.5, (this.z + 2) * 500)).applyMatrix4(
            // 	tile.matrixWorld
            // );
            tile.inFrustum = frustum.intersectsBox(bounds);
            // Get distance to camera
            tile.distToCamera = getDistance(tile, cameraWorldPosition);
            // console.log(params, 'params------------')
            // LOD
            const { action, newTiles } = tile._updateLOD(params);
            // console.log(action, 'action------------')
            this._processLODAction(tile, action, newTiles, params);
        });
        this._checkReadyState();
        // console.log(this, '此时更新的tile -------------')
        return this;
    }
    _processLODAction(currentTile, action, newTiles, params) {
        // console.log(action, 'action------------')
        // console.log(LODAction, 'LODAction------------')
        if (action === LODAction.create) {
            // Load new tiles data
            newTiles?.forEach(newTile => {
                newTile._initTile();
                newTile._isVirtualTile = newTile.z < params.minLevel;
                this.dispatchEvent({ type: "tile-created", tile: newTile });
                if (!newTile.isDummy) {
                    newTile._loadData(params.loader).then(() => {
                        // Show tile when all children has loaded
                        newTile._checkVisibility();
                        this.dispatchEvent({ type: "tile-loaded", tile: newTile });
                    });
                }
            });
        }
        else if (action === LODAction.remove) {
            currentTile.showing = true;
            // unload children tiles
            currentTile._disposeResources(false, params.loader);
            this.dispatchEvent({ type: "tile-unload", tile: currentTile });
        }
        return this;
    }
    /**
     * Reloads the tile data.
     * @returns this
     */
    reload(loader) {
        this._disposeResources(true, loader);
        return this;
    }
    /**
     * Checks if the tile is ready to render.
     * @returns this
     */
    _checkReadyState() {
        if (!this._isReady) {
            this._isReady = true;
            this.traverse(child => {
                if (child.isLeaf && child.loaded && !child.isDummy) {
                    this._isReady = false;
                    return;
                }
            });
            if (this._isReady) {
                this.dispatchEvent({ type: "ready" });
            }
        }
        return this;
    }
    /**
     * UnLoads the tile data.
     * @param disposeSelf - Whether to unload tile itself.
     * @returns this.
     */
    // private _disposeResources(disposeSelf: boolean, loader: ITileLoader) {
    // 	if (disposeSelf && this.isTile && !this.isDummy) {
    // 		this.dispatchEvent({ type: "unload" });
    // 		loader?.unload?.(this);
    // 	}
    // 	// remove all children recursively
    // 	this.children.forEach(child => child._disposeResources(true, loader));
    // 	this.clear();
    // 	return this;
    // }
    _disposeResources(disposeSelf, loader) {
        if (disposeSelf && this.isTile && !this.isDummy) {
            this.dispatchEvent({ type: "unload" });
            loader?.unload?.(this);
        }
        // remove all children recursively
        this.children.forEach(child => child._disposeResources(true, loader));
        this.clear();
        return this;
    }
}
Object.defineProperty(Tile, "_activeDownloads", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 0
});
