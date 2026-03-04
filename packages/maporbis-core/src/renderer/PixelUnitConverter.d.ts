import { Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';
interface ConversionOptions {
    distance?: number;
    useCache?: boolean;
}
/**
 * Pixel to Unit Converter
 * 像素单位转换器
 *
 * @description
 * Responsible for converting screen pixel values to world coordinate units (meters or degrees).
 * Handles coordinate system conversion for different camera types (Perspective/Orthographic).
 * 负责将屏幕像素值转换为世界坐标单位（米或度）。
 * 处理不同相机类型（透视/正交）的坐标系转换。
 */
declare class PixelUnitConverter {
    private camera;
    private renderer;
    private container;
    private cache;
    private resizeObserver;
    constructor(camera: Camera, renderer: WebGLRenderer | WebGPURenderer, container: HTMLElement);
    /**
     * Dispose resources
     * 清理资源
     */
    dispose(): void;
    /**
     * Setup event listeners
     * 设置事件监听
     */
    private setupEventListeners;
    private handleResize;
    /**
     * Validate distance parameter
     * 验证距离参数
     */
    private validateDistance;
    /**
     * Get container dimensions
     * 获取容器尺寸
     */
    private getContainerSize;
    /**
     * Generate cache key
     * 生成缓存键
     */
    private getCacheKey;
    /**
     * Calculate pixels to unit conversion ratio (Vertical)
     * 计算垂直方向的像素到单位换算比例
     */
    getPixelsToUnit(distance?: number, options?: ConversionOptions): number;
    /**
     * Calculate pixels to unit conversion ratio (Horizontal)
     * 计算水平方向的像素到单位换算比例
     */
    getPixelsToUnitHorizontal(distance?: number, options?: ConversionOptions): number;
    /**
     * 将像素尺寸转换为世界单位（垂直方向）
     */
    pixelsToUnits(pixels: number, distance?: number, options?: ConversionOptions): number;
    /**
     * 将像素尺寸转换为世界单位（水平方向）
     */
    pixelsToUnitsHorizontal(pixels: number, distance?: number, options?: ConversionOptions): number;
    /**
     * 将世界单位转换为像素尺寸（垂直方向）
     */
    unitsToPixels(units: number, distance?: number, options?: ConversionOptions): number;
    /**
     * 将世界单位转换为像素尺寸（水平方向）
     */
    unitsToPixelsHorizontal(units: number, distance?: number, options?: ConversionOptions): number;
    /**
     * 获取指定距离处的可见区域尺寸
     */
    getVisibleSizeAtDistance(distance?: number): {
        width: number;
        height: number;
    };
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 手动触发尺寸更新（当非ResizeObserver监听到的变化时使用）
     */
    update(): void;
}
export { PixelUnitConverter, type ConversionOptions };
