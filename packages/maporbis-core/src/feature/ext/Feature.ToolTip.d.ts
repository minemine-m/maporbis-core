import type { LngLatLike } from "../../types";
import { ToolTip, type ToolTipOptions } from "../../ui/ToolTip";
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
