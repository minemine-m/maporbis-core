import { TileSource } from "./TileSource";
/**
 * MapBox数据源类
 * @description 提供MapBox在线地图服务的瓦片数据
 * @extends TileSource
 */
export class MapBoxSource extends TileSource {
    /**
     * 构造函数
     * @param options 配置选项
     * @throws 当未提供token时抛出错误
     */
    constructor(options) {
        super(options);
        /**
         * MapBox访问令牌
         * @description 用于API请求认证
         */
        Object.defineProperty(this, "token", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        /**
         * 瓦片图像格式
         * @default "webp"
         * @description 支持webp、png、jpg等格式
         */
        Object.defineProperty(this, "format", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "webp"
        });
        /**
         * 地图样式ID
         * @default "cm2myr6qx001t01pi0sf7estf"
         */
        Object.defineProperty(this, "style", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "cm2myr6qx001t01pi0sf7estf"
        });
        /**
         * 数据源版权信息
         * @default "MapBox"
         */
        Object.defineProperty(this, "attribution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "MapBox"
        });
        /**
         * 最大缩放级别
         * @default 25
         */
        Object.defineProperty(this, "maxLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 25
        });
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
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.mapbox.com/styles/v1/criska/{style}/tiles/256/{z}/{x}/{y}?access_token={token}&format={format}"
        });
        Object.assign(this, options);
        if (!this.token) {
            throw new Error("MapBox访问令牌(token)是必填参数");
        }
    }
}
