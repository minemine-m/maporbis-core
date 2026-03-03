import { SourceOptions, TileSource } from "./TileSource";

/**
 * MapBox数据源配置选项
 * @extends SourceOptions
 */
export type MapBoxSourceOptions = SourceOptions & {
    /**
     * 地图样式ID
     * @default "cm2myr6qx001t01pi0sf7estf"
     */
    style?: string;
    
    /**
     * MapBox访问令牌（必填）
     * @description 用于验证MapBox API请求的访问令牌
     */
    token: string;
};

/**
 * MapBox数据源类
 * @description 提供MapBox在线地图服务的瓦片数据
 * @extends TileSource
 */
export class MapBoxSource extends TileSource {
    /**
     * MapBox访问令牌
     * @description 用于API请求认证
     */
    public token: string = "";

    /**
     * 瓦片图像格式
     * @default "webp"
     * @description 支持webp、png、jpg等格式
     */
    public format: string = "webp";

    /**
     * 地图样式ID
     * @default "cm2myr6qx001t01pi0sf7estf"
     */
    public style: string = "cm2myr6qx001t01pi0sf7estf";

    /**
     * 数据源版权信息
     * @default "MapBox"
     */
    public attribution = "MapBox";

    /**
     * 最大缩放级别
     * @default 25
     */
    public maxLevel: number = 25;

    /**
     * 瓦片URL模板
     * @default "https://api.mapbox.com/styles/v1/criska/cm2myr6qx001t01pi0sf7estf/tiles/256/{z}/{x}/{y}?access_token={token}&format={format}"
     * @description 模板变量：
     * - {z}: 缩放级别
     * - {x}: 瓦片X坐标
     * - {y}: 瓦片Y坐标
     * - {token}: 访问令牌
     * - {format}: 图像格式
     */
    public url = "https://api.mapbox.com/styles/v1/criska/{style}/tiles/256/{z}/{x}/{y}?access_token={token}&format={format}";

    /**
     * 构造函数
     * @param options 配置选项
     * @throws 当未提供token时抛出错误
     */
    constructor(options?: MapBoxSourceOptions) {
        super(options);
        Object.assign(this, options);
        
        if (!this.token) {
            throw new Error("MapBox访问令牌(token)是必填参数");
        }
    }
}