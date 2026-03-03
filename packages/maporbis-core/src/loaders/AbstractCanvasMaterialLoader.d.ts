import { Texture } from "three";
import { TileMaterial } from "../materials";
import { AbstractMaterialLoader } from "./AbstractMaterialLoader";
import { SourceLoadContext } from "./LoaderInterfaces";
/**
 * 抽象 Canvas 材质加载器
 * @abstract
 * @description 用于程序化生成纹理 (Procedural Textures)
 */
export declare abstract class AbstractCanvasMaterialLoader extends AbstractMaterialLoader {
    readonly info: {
        version: string;
        description: string;
    };
    /**
     * 重写 load 方法以支持 Canvas 特有的材质创建逻辑
     * @param context
     */
    load(context: SourceLoadContext): Promise<TileMaterial>;
    /**
     * 实现父类的 abstract 方法 (虽然在这里我们重写了 load，可能不会用到 performLoad，
     * 但为了满足 TypeScript 契约，我们还是需要实现它，或者抛出错误)
     */
    protected performLoad(_url: string, _context: SourceLoadContext): Promise<Texture>;
    /**
     * 绘制瓦片内容
     * @param ctx
     * @param context
     */
    protected abstract drawTile(ctx: OffscreenCanvasRenderingContext2D, context: SourceLoadContext): void;
    /**
     * 创建 Canvas 上下文并设置坐标系
     * @param width
     * @param height
     */
    private createCanvasContext;
}
