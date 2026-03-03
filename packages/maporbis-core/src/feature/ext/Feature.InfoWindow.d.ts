import type { LngLatLike } from "../../types";
import { InfoWindow, type InfoWindowOptions } from "../../ui/InfoWindow";
/**
 * Module extension: Add InfoWindow related properties and methods to Feature class.
 * 模块扩展：为 Feature 补充 InfoWindow 相关属性和方法的类型声明
 */
declare module "../Feature" {
    interface Feature {
        /**
         * Associated InfoWindow instance.
         * 关联的 InfoWindow 实例
         */
        _infoWindow?: InfoWindow;
        /**
         * Set InfoWindow for the feature.
         * 为要素设置 InfoWindow
         *
         * @param options InfoWindow configuration or instance
         *                InfoWindow 配置或实例
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        setInfoWindow(options: InfoWindowOptions | InfoWindow): this;
        /**
         * Get the InfoWindow currently bound to the feature.
         * 获取要素当前绑定的 InfoWindow
         *
         * @returns Bound InfoWindow instance or undefined
         *          绑定的 InfoWindow 实例或 undefined
         */
        getInfoWindow(): InfoWindow | undefined;
        /**
         * Open InfoWindow.
         * 打开 InfoWindow
         *
         * @param coordinate Optional geographic coordinate. If not provided, uses feature position or map center.
         *                   可选地理坐标，不传则用要素自身位置 / 地图中心
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        openInfoWindow(coordinate?: LngLatLike): this;
        /**
         * Close InfoWindow.
         * 关闭 InfoWindow
         *
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        closeInfoWindow(): this;
        /**
         * Remove InfoWindow.
         * 移除 InfoWindow
         *
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        removeInfoWindow(): this;
    }
}
