/**
 * 画布管理器类
 * 
 * 用于管理和复用HTMLCanvasElement实例，避免频繁创建和销毁canvas元素
  * @category Core
 */
export class CanvasManager {
    /** 画布字典，按尺寸和键名缓存canvas元素 */
    private canvasDict: Record<string, HTMLCanvasElement> = {};

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
    getCanvas(
        baseWidth: number = 40, 
        baseHeight: number = 30, 
        resolutionScale: number = 1,
        keySuffix?: string
    ): HTMLCanvasElement {
        // 计算实际像素尺寸
        const scaledWidth = Math.ceil(baseWidth * resolutionScale);
        const scaledHeight = Math.ceil(baseHeight * resolutionScale);
        
        // 生成缓存键名
        const key = keySuffix 
            ? `${scaledWidth}_${scaledHeight}_${keySuffix}` 
            : `${scaledWidth}_${scaledHeight}`;

        // 如果不存在则创建新画布
        if (!this.canvasDict[key]) {
            const canvas = document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            this.canvasDict[key] = canvas;
        }

        const canvas = this.canvasDict[key];
        const ctx = canvas.getContext('2d')!;
        
        // 重置画布状态（重要！）
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 清除缩放/旋转等变换
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 应用分辨率缩放（保持逻辑尺寸不变）
        ctx.scale(resolutionScale, resolutionScale);
        
        return canvas;
    }
}