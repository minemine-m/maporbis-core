import { Feature } from "../Feature";
import { InfoWindow } from "../../ui/InfoWindow";
/**
 * Runtime extension: Mount InfoWindow capabilities via Feature.include.
 * 运行时扩展：通过 Feature.include 挂载 InfoWindow 能力
 */
Feature.include({
    /**
     * Set InfoWindow for the feature.
     * 为要素设置 InfoWindow
     *
     * @param options InfoWindow configuration or instance
     *                InfoWindow 配置或实例
     * @returns Feature instance
     *          当前要素实例
     */
    setInfoWindow(options) {
        // Remove existing one first
        // 先移除已有的
        this.removeInfoWindow();
        let infoWindow;
        if (options instanceof InfoWindow) {
            infoWindow = options;
        }
        else {
            infoWindow = new InfoWindow(options);
        }
        this._infoWindow = infoWindow;
        // If already on map, addTo immediately
        // 如果已经在地图上，则立即 addTo
        const map = this.getMap();
        if (map) {
            infoWindow.addTo(this);
        }
        return this;
    },
    /**
     * Get the InfoWindow currently bound to the feature.
     * 获取要素当前绑定的 InfoWindow
     */
    getInfoWindow() {
        return this._infoWindow;
    },
    /**
     * Open InfoWindow.
     * 打开 InfoWindow
     *
     * @param coordinate Optional geographic coordinate
     *                   可选地理坐标
     */
    openInfoWindow(coordinate) {
        const infoWindow = this._infoWindow;
        if (!infoWindow) {
            return this;
        }
        // Ensure bound to map
        // 确保已经绑定到地图
        if (!infoWindow.getMap()) {
            const map = this.getMap();
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
    closeInfoWindow() {
        if (this._infoWindow) {
            this._infoWindow.close();
        }
        return this;
    },
    /**
     * Remove InfoWindow.
     * 移除 InfoWindow
     */
    removeInfoWindow() {
        if (this._infoWindow) {
            this._infoWindow.remove();
            this._infoWindow = undefined;
        }
        return this;
    }
});
