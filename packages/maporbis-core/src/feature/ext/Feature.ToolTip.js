import { Feature } from "../Feature";
import { ToolTip } from "../../ui/ToolTip";
/**
 * Runtime extension: Mount ToolTip capabilities via Feature.include.
 * 运行时扩展：通过 Feature.include 挂载 ToolTip 能力
 */
Feature.include({
    /**
     * Set ToolTip for the feature.
     * 为要素设置 ToolTip
     *
     * @param options ToolTip configuration or instance
     *                ToolTip 配置或实例
     * @returns Feature instance
     *          当前要素实例
     */
    setToolTip(options) {
        this.removeToolTip();
        let tip;
        if (options instanceof ToolTip) {
            tip = options;
        }
        else {
            tip = new ToolTip(options);
        }
        this._toolTip = tip;
        const map = this.getMap();
        if (map) {
            tip.addTo(this);
        }
        return this;
    },
    /**
     * Get the ToolTip currently bound to the feature.
     * 获取要素当前绑定的 ToolTip
     */
    getToolTip() {
        return this._toolTip;
    },
    /**
     * Open ToolTip.
     * 打开 ToolTip
     *
     * @param coordinate Optional geographic coordinate
     *                   可选地理坐标
     */
    openToolTip(coordinate) {
        const tip = this._toolTip;
        if (!tip)
            return this;
        if (!tip.getMap()) {
            const map = this.getMap();
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
    closeToolTip() {
        if (this._toolTip) {
            this._toolTip.hide();
        }
        return this;
    },
    /**
     * Remove ToolTip.
     * 移除 ToolTip
     */
    removeToolTip() {
        if (this._toolTip) {
            this._toolTip.remove();
            this._toolTip = undefined;
        }
        return this;
    },
});
