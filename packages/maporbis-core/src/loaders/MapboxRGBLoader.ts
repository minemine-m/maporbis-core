import { ImageLoader, MathUtils } from "three";
import { WorkerPool } from "three/examples/jsm/utils/WorkerPool.js";
import { MapTileGeometry } from "../geometries";
import { AbstractGeometryLoader } from "./AbstractGeometryLoader";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { SourceLoadContext } from "./LoaderInterfaces";
import { LoaderUtils } from "./LoaderUtils";
import ParseWorker from "./workers/rgb-parse.worker?worker&inline";

const WORKER_THREAD_COUNT = 10;

/**
 * Mapbox RGB 地形加载器
 * @class MapboxRGBLoader
 */
export class MapboxRGBLoader extends AbstractGeometryLoader {
    public readonly info = {
        version: "1.0.0",
        description: "Mapbox-RGB terrain loader for loading elevation data encoded in RGB textures.",
    };

    public readonly dataType = "terrain-rgb";

    private imageLoader = new ImageLoader(TileLoaderFactory.manager);
    private workerPool = new WorkerPool(0);

    constructor() {
        super();
        this.workerPool.setWorkerCreator(() => new ParseWorker());
    }

    /**
     * 执行加载
     * @param url 
     * @param context 
     */
    protected async performLoad(url: string, context: SourceLoadContext): Promise<MapTileGeometry> {
        // 1. 加载图像
        const image = await this.imageLoader.loadAsync(url).catch(() => new Image());

        // 2. 确定采样目标尺寸 (根据缩放级别自适应)
        const targetSize = MathUtils.clamp((context.z + 2) * 3, 2, 64);

        // 3. 裁剪并提取图像数据
        const imageData = this.extractSubImageData(image, context.bounds, targetSize);

        // 4. 初始化 Worker 池 (如果尚未初始化)
        if (this.workerPool.pool === 0) {
            this.workerPool.setWorkerLimit(WORKER_THREAD_COUNT);
        }

        // 5. 通过 Worker 解析 DEM 数据
        const response = await this.workerPool.postMessage(
            { imgData: imageData }, 
            [imageData.data.buffer]
        );
        const demData = response.data as Float32Array;

        // 6. 创建并返回几何体
        const geometry = new MapTileGeometry();
        geometry.setTerrainData(demData);

        return geometry;
    }

    /**
     * 提取子图像数据
     * @param image 源图像
     * @param bounds 裁剪边界
     * @param targetSize 目标尺寸
     */
    private extractSubImageData(image: HTMLImageElement, bounds: [number, number, number, number], targetSize: number): ImageData {
        const cropRect = LoaderUtils.getBoundsCoord(bounds, image.width);
        
        // 确保目标尺寸不超过裁剪区域
        const actualSize = Math.min(targetSize, cropRect.sw);
        
        const canvas = new OffscreenCanvas(actualSize, actualSize);
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
            image, 
            cropRect.sx, cropRect.sy, cropRect.sw, cropRect.sh, 
            0, 0, actualSize, actualSize
        );
        
        return ctx.getImageData(0, 0, actualSize, actualSize);
    }
}
