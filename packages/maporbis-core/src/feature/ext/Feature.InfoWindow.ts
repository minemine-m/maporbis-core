import { Feature } from "../Feature";
import type { LngLatLike } from "../../types";
import { InfoWindow, type InfoWindowOptions } from "../../ui/InfoWindow";
import type { Map } from "../../map";

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

/**
 * Runtime extension: Mount InfoWindow capabilities via Feature.include.
 * 运行时扩展：通过 Feature.include 挂载 InfoWindow 能力
 */
(Feature as any).include({
    /**
     * Set InfoWindow for the feature.
     * 为要素设置 InfoWindow
     * 
     * @param options InfoWindow configuration or instance
     *                InfoWindow 配置或实例
     * @returns Feature instance
     *          当前要素实例
     */
    setInfoWindow(this: Feature, options: InfoWindowOptions | InfoWindow) {
        // Remove existing one first
        // 先移除已有的
        this.removeInfoWindow();

        let infoWindow: InfoWindow;
        if (options instanceof InfoWindow) {
            infoWindow = options;
        } else {
            infoWindow = new InfoWindow(options);
        }

        this._infoWindow = infoWindow;

        // If already on map, addTo immediately
        // 如果已经在地图上，则立即 addTo
        const map: Map | null = this.getMap();
        if (map) {
            infoWindow.addTo(this);
        }

        return this;
    },

    /**
     * Get the InfoWindow currently bound to the feature.
     * 获取要素当前绑定的 InfoWindow
     */
    getInfoWindow(this: Feature): InfoWindow | undefined {
        return this._infoWindow;
    },

    /**
     * Open InfoWindow.
     * 打开 InfoWindow
     * 
     * @param coordinate Optional geographic coordinate
     *                   可选地理坐标
     */
    openInfoWindow(this: Feature, coordinate?: LngLatLike) {
        const infoWindow = this._infoWindow;
        if (!infoWindow) {
            return this;
        }

        // Ensure bound to map
        // 确保已经绑定到地图
        if (!infoWindow.getMap()) {
            const map: Map | null = this.getMap();
            if (map) {
                infoWindow.addTo(this);
            }
        }

        // Delay open by one frame to avoid calculating position when geometry/camera is unstable
        // 延后一帧再 open，避免在几何 / 相机尚未稳定时计算位置
        requestAnimationFrame(() => {
            infoWindow.open(coordinate);
        });

        return this;
    },
    
    /**
     * Close InfoWindow.
     * 关闭 InfoWindow
     */
    closeInfoWindow(this: Feature) {
        if (this._infoWindow) {
            this._infoWindow.close();
        }
        return this;
    },

    /**
     * Remove InfoWindow.
     * 移除 InfoWindow
     */
    removeInfoWindow(this: Feature) {
        if (this._infoWindow) {
            this._infoWindow.remove();
            this._infoWindow = undefined;
        }
        return this;
    }
});
