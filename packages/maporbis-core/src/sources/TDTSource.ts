import { SourceOptions, TileSource } from "./TileSource";

/**
 * 天地图地图样式类型
 * @description 定义天地图支持的各种地图样式
 */
type Style = "img_w" | "cia_w" | "cva_w" | "ibo_w" | "ter_w" | "vec_w" | "cta_w" | "img_c" | "cia_c";

/**
 * 天地图数据源配置选项
 * @extends SourceOptions
 */
export type TDTSourceOptins = SourceOptions & {
    /**
     * 地图样式类型
     * @default "img_w" (全球影像地图)
     */
    style?: Style;
    
    /**
     * 天地图访问令牌
     * @description 必须提供有效的天地图API访问令牌
     */
    token: string;
};

/**
 * 天地图标准瓦片数据源
 * @description 提供天地图标准地图服务的瓦片数据
 * @extends TileSource
 */
export class TDTSource extends TileSource {
    /**
     * 数据类型标识
     * @default "image"
     */
    public dataType: string = "image";

    /**
     * 数据源版权信息
     * @default "天地图"
     */
    public attribution = "天地图";

    /**
     * 天地图访问令牌
     * @description 用于API请求认证
     */
    public token: string = "";

    /**
     * 地图样式类型
     * @default "img_w" (全球影像地图)
     */
    public style: Style = "img_w";

    /**
     * 服务器子域列表
     * @default "01234"
     * @description 用于负载均衡的服务器子域轮询
     */
    public subdomains = "01234";

    /**
     * 瓦片URL模板
     * @default "https://t{s}.tianditu.gov.cn/DataServer?T={style}&x={x}&y={y}&l={z}&tk={token}"
     * @description 模板变量：
     * - {s}: 子域编号
     * - {style}: 地图样式
     * - {x}: 瓦片X坐标
     * - {y}: 瓦片Y坐标
     * - {z}: 缩放级别
     * - {token}: 访问令牌
     */
    public url = "https://t{s}.tianditu.gov.cn/DataServer?T={style}&x={x}&y={y}&l={z}&tk={token}";

    /**
     * 构造函数
     * @param options 配置选项
     * @throws 当未提供token时抛出错误
     */
    constructor(options?: TDTSourceOptins) {
        super(options);
        Object.assign(this, options);
        
        if (!this.token) {
            throw new Error("天地图访问令牌(token)是必填参数");
        }
    }
}

/**
 * 天地图量化网格地形数据源
 * @description 提供天地图地形高程数据服务
 * @extends TileSource
 */
export class TDTQMSource extends TileSource {
    /**
     * 数据类型标识
     * @default "quantized-mesh"
     */
    public dataType: string = "quantized-mesh";

    /**
     * 数据源版权信息
     * @default "天地图"
     */
    public attribution = "天地图";

    /**
     * 天地图访问令牌
     * @description 用于API请求认证
     */
    public token: string = "";

    /**
     * 服务器子域列表
     * @default "01234"
     * @description 用于负载均衡的服务器子域轮询
     */
    public subdomains = "01234";

    /**
     * 瓦片URL模板
     * @default "https://t{s}.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk={token}&x={x}&y={y}&l={z}"
     * @description 模板变量：
     * - {s}: 子域编号
     * - {token}: 访问令牌
     * - {x}: 瓦片X坐标
     * - {y}: 瓦片Y坐标
     * - {z}: 缩放级别
     */
    public url = "https://t{s}.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk={token}&x={x}&y={y}&l={z}";

    /**
     * 构造函数
     * @param options 配置选项
     * @throws 当未提供token时抛出错误
     */
    constructor(options?: TDTSourceOptins) {
        super(options);
        Object.assign(this, options);
        
        if (!this.token) {
            throw new Error("天地图访问令牌(token)是必填参数");
        }
    }
}