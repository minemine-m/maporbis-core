import { Texture } from "three";
import { AbstractMaterialLoader } from "./AbstractMaterialLoader";
import { SourceLoadContext } from "./LoaderInterfaces";
/**
 * Web 图像加载器
 * @class WebImageLoader
 * @description 加载标准 XYZ 瓦片图像 (PNG, JPG, etc.)
 */
export declare class WebImageLoader extends AbstractMaterialLoader {
    readonly info: {
        version: string;
        description: string;
    };
    readonly dataType = "image";
    private loader;
    /**
     * 执行加载
     * @param url
     * @param context
     */
    protected performLoad(url: string, context: SourceLoadContext): Promise<Texture>;
    /**
     * 提取子图像
     * @param image
     * @param bounds
     */
    private extractSubImage;
}
