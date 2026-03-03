import { TileSource } from "./TileSource";
/**
 * ArcGIS影像数据源类
 * @description 提供ArcGIS在线地图服务的瓦片数据
 * @extends TileSource
 */
export class ArcGisSource extends TileSource {
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options) {
        super(options);
        /**
         * 数据类型标识
         * @default "image"
         */
        Object.defineProperty(this, "dataType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "image"
        });
        /**
         * 数据源版权信息
         * @default "ArcGIS"
         */
        Object.defineProperty(this, "attribution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ArcGIS"
        });
        /**
         * 地图样式
         * @default "World_Imagery"
         */
        Object.defineProperty(this, "style", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "World_Imagery"
        });
        /**
         * 瓦片URL模板
         * @default "https://services.arcgisonline.com/arcgis/rest/services/{style}/MapServer/tile/{z}/{y}/{x}"
         */
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://services.arcgisonline.com/arcgis/rest/services/{style}/MapServer/tile/{z}/{y}/{x}"
        });
        Object.assign(this, options);
    }
}
/**
 * ArcGIS地形数据源类
 * @description 提供ArcGIS在线地形高程数据
 * @extends TileSource
 */
export class ArcGisDemSource extends TileSource {
    /**
     * 构造函数
     * @param options 配置选项
     */
    constructor(options) {
        super(options);
        /**
         * 数据类型标识
         * @default "lerc"
         */
        Object.defineProperty(this, "dataType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "lerc"
        });
        /**
         * 数据源版权信息
         * @default "ArcGIS"
         */
        Object.defineProperty(this, "attribution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ArcGIS"
        });
        /**
         * 最小层级
         * @default 6
         */
        Object.defineProperty(this, "minLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 6
        });
        /**
         * 最大层级
         * @default 13
         */
        Object.defineProperty(this, "maxLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 13
        });
        /**
         * 瓦片URL模板
         * @default "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/{z}/{y}/{x}"
         */
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/{z}/{y}/{x}"
        });
        Object.assign(this, options);
    }
}
