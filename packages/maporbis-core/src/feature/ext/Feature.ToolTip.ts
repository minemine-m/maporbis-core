import { Feature } from "../Feature";
import type { LngLatLike } from "../../types";
import { ToolTip, type ToolTipOptions } from "../../ui/ToolTip";
import type { Map } from "../../map";

/**
 * Module extension: Add ToolTip related properties and methods to Feature class.
 * 模块扩展：为 Feature 补充 ToolTip 相关属性和方法的类型声明
 */
declare module "../Feature" {
    interface Feature {
        /**
         * Associated ToolTip instance.
         * 关联的 ToolTip 实例
         */
        _toolTip?: ToolTip;

        /**
         * Set ToolTip for the feature.
         * 为要素设置 ToolTip
         * 
         * @param options ToolTip configuration or instance
         *                ToolTip 配置或实例
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        setToolTip(options: ToolTipOptions | ToolTip): this;

        /**
         * Get the ToolTip currently bound to the feature.
         * 获取要素当前绑定的 ToolTip
         * 
         * @returns Bound ToolTip instance or undefined
         *          绑定的 ToolTip 实例或 undefined
         */
        getToolTip(): ToolTip | undefined;

        /**
         * Open ToolTip.
         * 打开 ToolTip
         * 
         * @param coordinate Optional geographic coordinate. If not provided, uses feature position or map center.
         *                   可选地理坐标，不传则用要素自身位置 / 地图中心
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        openToolTip(coordinate?: LngLatLike): this;

        /**
         * Close ToolTip.
         * 关闭 ToolTip
         * 
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        closeToolTip(): this;

        /**
         * Remove ToolTip.
         * 移除 ToolTip
         * 
         * @returns Feature instance (supports chaining)
         *          当前要素实例
         */
        removeToolTip(): this;
    }
}

/**
 * Runtime extension: Mount ToolTip capabilities via Feature.include.
 * 运行时扩展：通过 Feature.include 挂载 ToolTip 能力
 */
(Feature as any).include({
    /**
     * Set ToolTip for the feature.
     * 为要素设置 ToolTip
     * 
     * @param options ToolTip configuration or instance
     *                ToolTip 配置或实例
     * @returns Feature instance
     *          当前要素实例
     */
    setToolTip(this: Feature, options: ToolTipOptions | ToolTip) {
        this.removeToolTip();

        let tip: ToolTip;
        if (options instanceof ToolTip) {
            tip = options;
        } else {
            tip = new ToolTip(options);
        }

        this._toolTip = tip;

        const map: Map | null = this.getMap();
        if (map) {
            tip.addTo(this);
        }

        return this;
    },

    /**
     * Get the ToolTip currently bound to the feature.
     * 获取要素当前绑定的 ToolTip
     */
    getToolTip(this: Feature) {
        return this._toolTip;
    },

    /**
     * Open ToolTip.
     * 打开 ToolTip
     * 
     * @param coordinate Optional geographic coordinate
     *                   可选地理坐标
     */
    openToolTip(this: Feature, coordinate?: LngLatLike) {
        const tip = this._toolTip;
        if (!tip) return this;

        if (!tip.getMap()) {
            const map: Map | null = this.getMap();
            if (map) {
                tip.addTo(this);
            }
        }

        // Here we don't need requestAnimationFrame usually as tooltip is triggered by hover
        // 这里可以不用 requestAnimationFrame，tooltip 一般只是 hover 触发
        tip.show(coordinate);
        return this;
    },

    /**
     * Close ToolTip.
     * 关闭 ToolTip
     */
    closeToolTip(this: Feature) {
        if (this._toolTip) {
            this._toolTip.hide();
        }
        return this;
    },

    /**
     * Remove ToolTip.
     * 移除 ToolTip
     */
    removeToolTip(this: Feature) {
        if (this._toolTip) {
            this._toolTip.remove();
            this._toolTip = undefined;
        }
        return this;
    },
});
