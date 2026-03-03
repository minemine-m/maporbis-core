import { CanvasTexture } from "three";
import { TileMaterial } from "../materials";
import { AbstractMaterialLoader } from "./AbstractMaterialLoader";
/**
 * 抽象 Canvas 材质加载器
 * @abstract
 * @description 用于程序化生成纹理 (Procedural Textures)
 */
export class AbstractCanvasMaterialLoader extends AbstractMaterialLoader {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "info", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                version: "1.0.0",
                description: "Abstract loader for generating procedural canvas textures.",
            }
        });
    }
    /**
     * 重写 load 方法以支持 Canvas 特有的材质创建逻辑
     * @param context
     */
    async load(context) {
        // 创建 Canvas 上下文
        const ctx = this.createCanvasContext(256, 256);
        // 绘制内容 (由子类实现)
        this.drawTile(ctx, context);
        // 创建纹理
        const texture = new CanvasTexture(ctx.canvas.transferToImageBitmap());
        // 创建材质
        const material = new TileMaterial({
            transparent: true,
            map: texture,
            opacity: context.source.opacity ?? 1.0,
        });
        // 这里的 parseEnd 可能不需要调用，因为没有外部 URL 加载过程，但为了保持一致性...
        // 如果没有 URL，AbstractMaterialLoader 不会调用它。
        return material;
    }
    /**
     * 实现父类的 abstract 方法 (虽然在这里我们重写了 load，可能不会用到 performLoad，
     * 但为了满足 TypeScript 契约，我们还是需要实现它，或者抛出错误)
     */
    async performLoad(_url, _context) {
        throw new Error("Method not implemented.");
    }
    /**
     * 创建 Canvas 上下文并设置坐标系
     * @param width
     * @param height
     */
    createCanvasContext(width, height) {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to create OffscreenCanvas context");
        }
        // 设置坐标系：原点在左下角，Y轴向上 (符合地图坐标系习惯)
        // 原始代码: ctx.scale(1, -1); ctx.translate(0, -height);
        // 这将 (0,0) 移到左下角，并且 Y 轴向上。
        ctx.scale(1, -1);
        ctx.translate(0, -height);
        return ctx;
    }
}
