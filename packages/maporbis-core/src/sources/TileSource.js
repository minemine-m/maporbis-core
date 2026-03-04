import { interpolate } from "../utils";
/**
 *  Base class for data sources, users can customize data sources by inheriting this class
 *  数据源基类，用户可以通过继承此类来自定义数据源
 */
export class TileSource {
    /** Data type that determines which loader to use for loading and processing data. Default is "image" type. 决定使用哪个加载器加载和处理数据的类型，默认为"image"类型 */
    dataType = "image";
    /** Copyright attribution information for the data source, used for displaying map copyright notices. 数据源版权信息，用于显示地图版权声明 */
    attribution = "isource";
    /** Minimum zoom level supported by the data source. Default is 0. 数据源支持的最小缩放级别，默认为0 */
    minLevel = 0;
    /** Maximum zoom level supported by the data source. Default is 18. 数据源支持的最大缩放级别，默认为18 */
    maxLevel = 18;
    /** Data projection type. Default is "3857" Mercator projection. 数据投影类型，默认为"3857"墨卡托投影 */
    projectionID = "3857";
    /** URL template for tile data. Uses variables like {x},{y},{z} to construct tile request URLs. 瓦片数据URL模板，使用{x},{y},{z}等变量构建请求URL */
    url = "";
    /** List of URL subdomains for load balancing. Can be an array of strings or a single string. 用于负载均衡的URL子域名列表，可以是字符串数组或单个字符串 */
    subdomains = [];
    /** Currently used subdomain. Randomly selected from subdomains when requesting tiles. 当前使用的子域名，请求瓦片时随机选择 */
    s = "";
    /** Layer opacity. Range 0-1, default is 1.0 (completely opaque). 图层不透明度，范围0-1，默认1.0（完全不透明） */
    opacity = 1.0;
    /** Whether to use TMS tile coordinate system. Default false uses XYZ system, true uses TMS system. 是否使用TMS瓦片坐标系，默认false使用XYZ坐标系，true使用TMS坐标系 */
    isTMS = false;
    /** Data bounds in format [minLon, minLat, maxLon, maxLat]. Default covers global range excluding polar regions. 数据范围格式[minLon, minLat, maxLon, maxLat]，默认覆盖全球范围（不含极地） */
    bounds = [-180, -85, 180, 85];
    /** Projected data bounds. 投影后的数据范围 */
    _projectionBounds = [-Infinity, -Infinity, Infinity, Infinity];
    /** Tile material. 瓦片材质 */
    tileMaterial;
    /**
     * constructor
     * 构造函数
     * @param options SourceOptions
     */
    constructor(options) {
        Object.assign(this, options);
    }
    /**
     * Get url from tile coordinate, public, overwrite to custom generation tile url from xyz
     * 根据瓦片坐标获取URL，公开方法，可重写以自定义生成URL
     * @param x tile x coordinate 瓦片X坐标
     * @param y tile y coordinate 瓦片Y坐标
     * @param z tile z coordinate 瓦片Z坐标
     * @returns url tile url 瓦片URL
     */
    getUrl(x, y, z) {
        const obj = { ...this, ...{ x, y, z } };
        return interpolate(this.url, obj);
    }
    /**
     * Get url from tile coordinate, public, called by TileLoader system
     * 根据瓦片坐标获取URL，公开方法，由瓦片加载系统调用
     * @param x tile x coordinate 瓦片X坐标
     * @param y tile y coordinate 瓦片Y坐标
     * @param z tile z coordinate 瓦片Z坐标
     * @returns url tile url 瓦片URL
     */
    _getUrl(x, y, z) {
        // get subdomains random
        // 随机获取子域名
        const subLen = this.subdomains.length;
        if (subLen > 0) {
            const index = Math.floor(Math.random() * subLen);
            this.s = this.subdomains[index];
        }
        // reverse y coordinate if TMS scheme
        // 如果是TMS方案，反转Y坐标
        const reverseY = this.isTMS ? Math.pow(2, z) - 1 - y : y;
        return this.getUrl(x, reverseY, z);
    }
    /**
     * Create source directly through factoy functions.
     * @param options source options
     * @returns ISource data source instance
     */
    static create(options) {
        return new TileSource(options);
    }
}
