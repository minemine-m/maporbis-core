import { ImageLoader, SRGBColorSpace, Texture } from "three";
import { AbstractMaterialLoader } from "./AbstractMaterialLoader";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { SourceLoadContext } from "./LoaderInterfaces";
import { LoaderUtils } from "./LoaderUtils";

/**
 * Web 图像加载器
 * @class WebImageLoader
 * @description 加载标准 XYZ 瓦片图像 (PNG, JPG, etc.)
 */
export class WebImageLoader extends AbstractMaterialLoader {
    public readonly info = {
        version: "1.0.0",
        description: "Loader for standard web images (XYZ tiles).",
    };

    public readonly dataType = "image";

    private loader = new ImageLoader(TileLoaderFactory.manager);

    /**
     * 执行加载
     * @param url 
     * @param context 
     */
    protected async performLoad(url: string, context: SourceLoadContext): Promise<Texture> {
        // 1. 加载原始图像
        const img = await this.loader.loadAsync(url).catch(() => {
            // 返回 1x1 透明像素作为 fallback
            return new Image(1, 1);
        });

        // 2. 创建纹理
        const texture = new Texture();
        texture.colorSpace = SRGBColorSpace;
        
        const { bounds } = context;

        // 3. 检查是否需要裁剪
        // 如果 bounds 不是 [0,0,1,1] (即 width < 1)，则说明是从父瓦片裁剪的
        if (bounds[2] - bounds[0] < 1 || bounds[3] - bounds[1] < 1) {
            texture.image = this.extractSubImage(img, bounds);
        } else {
            texture.image = img;
        }

        texture.needsUpdate = true;
        return texture;
    }

    /**
     * 提取子图像
     * @param image 
     * @param bounds 
     */
    private extractSubImage(image: HTMLImageElement, bounds: [number, number, number, number]): OffscreenCanvas {
        const size = image.width;
        // 使用 OffscreenCanvas 进行裁剪
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d")!;
        
        const { sx, sy, sw, sh } = LoaderUtils.getBoundsCoord(bounds, size);
        
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, size, size);
        return canvas;
    }
}
