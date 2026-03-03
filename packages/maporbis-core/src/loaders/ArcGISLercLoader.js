import { FileLoader } from "three";
import { WorkerPool } from "three/examples/jsm/utils/WorkerPool.js";
import { MapTileGeometry } from "../geometries";
import { AbstractGeometryLoader } from "./AbstractGeometryLoader";
import { TileLoaderFactory } from "./TileLoaderFactory";
import ParseWorker from "./workers/lerc-parse.worker?worker&inline";
const WORKER_THREAD_COUNT = 10;
/**
 * ArcGIS LERC 地形加载器
 * @class ArcGISLercLoader
 * @description 加载并解析 LERC (Limited Error Raster Compression) 格式的高程数据
 */
export class ArcGISLercLoader extends AbstractGeometryLoader {
    constructor() {
        super();
        Object.defineProperty(this, "info", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                version: "1.0.0",
                description: "Loader for ArcGIS LERC compressed terrain data.",
            }
        });
        Object.defineProperty(this, "dataType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "lerc"
        });
        Object.defineProperty(this, "fileLoader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new FileLoader(TileLoaderFactory.manager)
        });
        Object.defineProperty(this, "workerPool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new WorkerPool(0)
        });
        this.fileLoader.setResponseType("arraybuffer");
        this.workerPool.setWorkerCreator(() => new ParseWorker());
    }
    /**
     * 执行加载
     * @param url
     * @param context
     */
    async performLoad(url, context) {
        // 1. 初始化 Worker 池
        if (this.workerPool.pool === 0) {
            this.workerPool.setWorkerLimit(WORKER_THREAD_COUNT);
        }
        // 2. 加载二进制数据
        const buffer = await this.fileLoader.loadAsync(url).catch(() => {
            // 加载失败时返回默认平坦地形 (256x256)
            return new Float32Array(256 * 256).buffer;
        });
        // 3. 构建 Worker 消息
        const message = {
            demData: buffer,
            z: context.z,
            clipBounds: context.bounds,
        };
        // 4. 发送到 Worker 进行解析
        // 注意：这里我们将 buffer 转移给 Worker 以避免拷贝 (Transferable)
        const response = await this.workerPool.postMessage(message, [buffer]);
        const geoData = response.data;
        // 5. 创建几何体
        const geometry = new MapTileGeometry();
        geometry.setTerrainData(geoData);
        return geometry;
    }
}
