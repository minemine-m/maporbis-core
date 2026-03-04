import { MeshBasicMaterial } from "three";
import { TileLoaderFactory } from "./TileLoaderFactory";
import { LoaderUtils } from "./LoaderUtils";
/**
 * 抽象材质加载器基类
 * @class AbstractMaterialLoader
 */
export class AbstractMaterialLoader {
    info = {
        version: "1.0.0",
        description: "Abstract material loader base class",
    };
    /**
     * 从数据源加载材质
     * @param context 加载上下文
     */
    async load(context) {
        const { source, x, y, z } = context;
        // 使用 MeshBasicMaterial 作为默认材质，后续可以扩展为支持自定义材质类
        const material = new MeshBasicMaterial({
            transparent: true,
            // polygonOffset: true, // 根据需求开启
            // polygonOffsetFactor: 1,
            // polygonOffsetUnits: 1
        });
        const { url, clipBounds } = LoaderUtils.getSafeTileUrlAndBounds(source, x, y, z);
        if (url) {
            try {
                // 加载纹理
                const texture = await this.performLoad(url, { ...context, bounds: clipBounds });
                material.map = texture;
                // 通知加载管理器
                TileLoaderFactory.manager.parseEnd(url);
            }
            catch (err) {
                console.warn(`[AbstractMaterialLoader] Failed to load texture from ${url}`, err);
                // 保持 material.map 为空或设置错误占位图
            }
        }
        return material;
    }
    /**
     * 卸载材质资源
     * @param material
     */
    unload(material) {
        if (material.map) {
            material.map.dispose();
        }
        material.dispose();
    }
}
