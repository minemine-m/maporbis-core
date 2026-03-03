import { BufferGeometry, LoadingManager, Material, Mesh, Texture } from "three";
import { ISource } from "../sources";

/**
 * 瓦片加载管理器
 */
export class TileLoadingManager extends LoadingManager {
    public onParseEnd?: (url: string) => void = undefined;

    public parseEnd(url: string) {
        if (this.onParseEnd) {
            this.onParseEnd(url);
        }
    }
}

/**
 * 瓦片网格数据类型
 */
export type TileMeshData = {
    materials: Material[];
    geometry: BufferGeometry;
};

/**
 * 扩展材质接口
 */
export interface ITileMaterial extends Material {
    map?: Texture | null;
}

/**
 * 瓦片坐标及边界参数
 */
export type TileLoadContext = {
    x: number;
    y: number;
    z: number;
    bounds: [number, number, number, number];
    lonLatBounds?: [number, number, number, number];
};

/**
 * 数据源加载上下文
 */
export type SourceLoadContext<TSource extends ISource = ISource> = TileLoadContext & {
    source: TSource;
};

/**
 * 加载器元数据
 */
export interface LoaderMetadata {
    version: string;
    author?: string;
    description?: string;
}

/**
 * 材质加载器接口
 */
export interface IMaterialLoader<TMaterial extends Material = Material> {
    readonly isMaterialLoader?: true;
    readonly info: LoaderMetadata;
    readonly dataType: string;
    
    load(context: SourceLoadContext): Promise<TMaterial>;
    unload?(material: TMaterial): void;
}

/**
 * 几何体加载器接口
 */
export interface IGeometryLoader<TGeometry extends BufferGeometry = BufferGeometry> {
    readonly isMaterialLoader?: false;
    readonly info: LoaderMetadata;
    readonly dataType: string;
    
    load(context: SourceLoadContext): Promise<TGeometry>;
    unload?(geometry: TGeometry): void;
}

/**
 * 综合瓦片加载器接口
 */
export interface ICompositeLoader<TMeshData extends TileMeshData = TileMeshData> {
    manager: TileLoadingManager;
    imgSource: ISource[];
    demSource: ISource | undefined;
    
    load(context: TileLoadContext): Promise<TMeshData>;
    unload?(tileMesh: Mesh): void;
}
