/**
 * 画布管理器类
 *
 * 用于管理和复用HTMLCanvasElement实例，避免频繁创建和销毁canvas元素
  * @category Core
 */
export declare class CanvasManager {
    /** 画布字典，按尺寸和键名缓存canvas元素 */
    private canvasDict;
    /**
     * 获取指定尺寸的画布
     * @param baseWidth 画布基础宽度（逻辑像素）
     * @param baseHeight 画布基础高度（逻辑像素）
     * @param resolutionScale 分辨率缩放因子（默认为1）
     * @param keySuffix 缓存键名后缀（可选）
     * @returns HTMLCanvasElement实例
     *
     * @example
     * // 获取一个40x30的基础画布
     * const canvas1 = manager.getCanvas(40, 30);
     *
     * // 获取一个2倍分辨率的40x30画布
     * const canvas2 = manager.getCanvas(40, 30, 2);
     *
     * // 获取带特定后缀的缓存画布
     * const canvas3 = manager.getCanvas(40, 30, 1, 'special');
     */
    getCanvas(baseWidth?: number, baseHeight?: number, resolutionScale?: number, keySuffix?: string): HTMLCanvasElement;
}
