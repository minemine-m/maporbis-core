import { Texture } from "three";
import { IMaterialLoader, ITileMaterial, LoaderMetadata, SourceLoadContext } from "./LoaderInterfaces";
/**
 * 抽象材质加载器基类
 * @class AbstractMaterialLoader
 */
export declare abstract class AbstractMaterialLoader implements IMaterialLoader<ITileMaterial> {
    readonly info: LoaderMetadata;
    abstract readonly dataType: string;
    /**
     * 从数据源加载材质
     * @param context 加载上下文
     */
    load(context: SourceLoadContext): Promise<ITileMaterial>;
    /**
     * 卸载材质资源
     * @param material
     */
    unload(material: ITileMaterial): void;
    /**
     * 执行实际加载逻辑 (由子类实现)
     * @param url 数据 URL
     * @param context 加载上下文
     */
    protected abstract performLoad(url: string, context: SourceLoadContext): Promise<Texture>;
}
