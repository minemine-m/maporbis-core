import { ProjectionType, ISource } from "./ISource";
import { Material } from "three";
/**
 * source construtor params type
 * 数据源构造函数参数类型
 */
export interface SourceOptions {
    /** A string identifies the source data type, it requires the support of the loader. 数据源类型标识字符串，需要加载器支持 */
    dataType?: string;
    /** Source attribution info, it allows you to display attribution. 数据源版权信息，用于显示版权 */
    attribution?: string;
    /** Data max level. 数据最大层级 */
    minLevel?: number;
    /** Data min level. 数据最小层级 */
    maxLevel?: number;
    /** Data projection. 数据投影 */
    projectionID?: ProjectionType;
    /** Display opacity. 显示不透明度 */
    opacity?: number;
    bounds?: [number, number, number, number];
    /** Data Url template. 数据URL模板 */
    url?: string;
    /** Url subdomains array or string. URL子域名数组或字符串 */
    subdomains?: string[] | string;
    /** Is TMS scheme. 是否为TMS方案 */
    isTMS?: boolean;
    /** Any data. 任意数据 */
    [key: string]: unknown;
}
/**
 *  Base class for data sources, users can customize data sources by inheriting this class
 *  数据源基类，用户可以通过继承此类来自定义数据源
 */
export declare class TileSource implements ISource {
    /** Data type that determines which loader to use for loading and processing data. Default is "image" type. 决定使用哪个加载器加载和处理数据的类型，默认为"image"类型 */
    dataType: string;
    /** Copyright attribution information for the data source, used for displaying map copyright notices. 数据源版权信息，用于显示地图版权声明 */
    attribution: string;
    /** Minimum zoom level supported by the data source. Default is 0. 数据源支持的最小缩放级别，默认为0 */
    minLevel: number;
    /** Maximum zoom level supported by the data source. Default is 18. 数据源支持的最大缩放级别，默认为18 */
    maxLevel: number;
    /** Data projection type. Default is "3857" Mercator projection. 数据投影类型，默认为"3857"墨卡托投影 */
    projectionID: ProjectionType;
    /** URL template for tile data. Uses variables like {x},{y},{z} to construct tile request URLs. 瓦片数据URL模板，使用{x},{y},{z}等变量构建请求URL */
    url: string;
    /** List of URL subdomains for load balancing. Can be an array of strings or a single string. 用于负载均衡的URL子域名列表，可以是字符串数组或单个字符串 */
    subdomains: string[] | string;
    /** Currently used subdomain. Randomly selected from subdomains when requesting tiles. 当前使用的子域名，请求瓦片时随机选择 */
    s: string;
    /** Layer opacity. Range 0-1, default is 1.0 (completely opaque). 图层不透明度，范围0-1，默认1.0（完全不透明） */
    opacity: number;
    /** Whether to use TMS tile coordinate system. Default false uses XYZ system, true uses TMS system. 是否使用TMS瓦片坐标系，默认false使用XYZ坐标系，true使用TMS坐标系 */
    isTMS: boolean;
    /** Data bounds in format [minLon, minLat, maxLon, maxLat]. Default covers global range excluding polar regions. 数据范围格式[minLon, minLat, maxLon, maxLat]，默认覆盖全球范围（不含极地） */
    bounds: [number, number, number, number];
    /** Projected data bounds. 投影后的数据范围 */
    _projectionBounds: [number, number, number, number];
    /** Tile material. 瓦片材质 */
    tileMaterial?: Material;
    /** Any data. 任意数据 */
    [key: string]: unknown;
    /**
     * constructor
     * 构造函数
     * @param options SourceOptions
     */
    constructor(options?: SourceOptions);
    /**
     * Get url from tile coordinate, public, overwrite to custom generation tile url from xyz
     * 根据瓦片坐标获取URL，公开方法，可重写以自定义生成URL
     * @param x tile x coordinate 瓦片X坐标
     * @param y tile y coordinate 瓦片Y坐标
     * @param z tile z coordinate 瓦片Z坐标
     * @returns url tile url 瓦片URL
     */
    getUrl(x: number, y: number, z: number): string | undefined;
    /**
     * Get url from tile coordinate, public, called by TileLoader system
     * 根据瓦片坐标获取URL，公开方法，由瓦片加载系统调用
     * @param x tile x coordinate 瓦片X坐标
     * @param y tile y coordinate 瓦片Y坐标
     * @param z tile z coordinate 瓦片Z坐标
     * @returns url tile url 瓦片URL
     */
    _getUrl(x: number, y: number, z: number): string | undefined;
    /**
     * Create source directly through factoy functions.
     * @param options source options
     * @returns ISource data source instance
     */
    static create(options: SourceOptions): TileSource;
}
