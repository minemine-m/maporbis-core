import { SourceOptions, TileSource } from "./TileSource";
/**
 * ArcGIS影像源配置选项
 * @extends SourceOptions
 */
export type ArcGisSourceOptions = SourceOptions & {
    /**
     * 地图样式
     * @default "World_Imagery"
     */
    style?: string;
};
/**
 * ArcGIS影像数据源类
 * @description 提供ArcGIS在线地图服务的瓦片数据
 * @extends TileSource
 */
export declare class ArcGisSource extends TileSource {
    /**
     * 数据类型标识
     * @default "image"
     */
    dataType: string;
    /**
     * 数据源版权信息
     * @default "ArcGIS"
     */
    attribution: string;
    /**
     * 地图样式
     * @default "World_Imagery"
     */
    style: string;
    /**
     * 瓦片URL模板
     * @default "https://services.arcgisonline.com/arcgis/rest/services/{style}/MapServer/tile/{z}/{y}/{x}"
     */
    url: string;
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options?: ArcGisSourceOptions);
}
/**
 * ArcGIS地形数据源类
 * @description 提供ArcGIS在线地形高程数据
 * @extends TileSource
 */
export declare class ArcGisDemSource extends TileSource {
    /**
     * 数据类型标识
     * @default "lerc"
     */
    dataType: string;
    /**
     * 数据源版权信息
     * @default "ArcGIS"
     */
    attribution: string;
    /**
     * 最小层级
     * @default 6
     */
    minLevel: number;
    /**
     * 最大层级
     * @default 13
     */
    maxLevel: number;
    /**
     * 瓦片URL模板
     * @default "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/{z}/{y}/{x}"
     */
    url: string;
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options?: SourceOptions);
}
