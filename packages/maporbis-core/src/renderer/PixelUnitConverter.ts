import { Camera, WebGLRenderer, PerspectiveCamera, OrthographicCamera } from 'three';
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
class PixelUnitConverter {
    private camera: Camera;
    private renderer: WebGLRenderer | WebGPURenderer;
    private container: HTMLElement;
    private cache: Map<string, number>;
    private resizeObserver: ResizeObserver | null;

    constructor(camera: Camera, renderer: WebGLRenderer | WebGPURenderer, container: HTMLElement) {
        this.camera = camera;
        this.renderer = renderer;
        this.container = container;
        this.cache = new Map();
        this.resizeObserver = null;

        this.setupEventListeners();
    }

    /**
     * Dispose resources
     * 清理资源
     */
    dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.cache.clear();
    }

    /**
     * Setup event listeners
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // Monitor container size changes
        // 监听容器尺寸变化
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                this.cache.clear(); // Clear cache on resize 尺寸变化时清除缓存
            });
            this.resizeObserver.observe(this.container);
        }

        // Monitor window size changes (handle scrollbars etc.)
        // 监听窗口尺寸变化（处理滚动条等变化）
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    private handleResize(): void {
        this.cache.clear();
    }

    /**
     * Validate distance parameter
     * 验证距离参数
     */
    private validateDistance(distance?: number): any {
        if (this.camera instanceof PerspectiveCamera) {
            if (distance !== undefined) {
                if (this.camera instanceof PerspectiveCamera && distance <= 0) {
                    console.warn('Distance should be positive, using camera near plane');
                    return this.camera.near;
                }
                if (this.camera instanceof PerspectiveCamera && distance > this.camera.far) {
                    console.warn('Distance exceeds camera far plane, result may be inaccurate');
                }
                return distance;
            }
            return this.camera.near;
        }

    }

    /**
     * Get container dimensions
     * 获取容器尺寸
     */
    private getContainerSize(): { width: number; height: number } {
        const rect = this.container.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            console.warn('Container has zero size, using renderer dimensions as fallback');
            return {
                width: this.renderer.domElement.width,
                height: this.renderer.domElement.height
            };
        }

        return {
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Generate cache key
     * 生成缓存键
     */
    private getCacheKey(direction: 'vertical' | 'horizontal', distance?: number): string {
        return `${direction}_${distance ?? 'default'}_${this.container.clientWidth}x${this.container.clientHeight}`;
    }

    /**
     * Calculate pixels to unit conversion ratio (Vertical)
     * 计算垂直方向的像素到单位换算比例
     */
    getPixelsToUnit(distance?: number, options: ConversionOptions = {}): number {
        const useCache = options.useCache ?? true;
        const cacheKey = this.getCacheKey('vertical', distance);

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const { height } = this.getContainerSize();
        if (height === 0) {
            console.error('Container height is zero');
            return 0;
        }

        const dist = this.validateDistance(distance);
        let ratio: number;

        if (this.camera instanceof PerspectiveCamera) {
            // Perspective Camera
            // 透视相机
            const vFov = this.camera.fov * Math.PI / 180;
            const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
            ratio = visibleHeight / height;
        } else if (this.camera instanceof OrthographicCamera) {
            // Orthographic Camera - distance parameter doesn't affect result but kept for consistency
            // 正交相机 - 距离参数不影响结果但保持接口一致性
            const visibleHeight = this.camera.top - this.camera.bottom;
            ratio = visibleHeight / height;
        } else {
            console.warn('Unsupported camera type, using fallback calculation');
            ratio = 1 / height;
        }

        if (useCache) {
            this.cache.set(cacheKey, ratio);
        }

        return ratio;
    }

    /**
     * Calculate pixels to unit conversion ratio (Horizontal)
     * 计算水平方向的像素到单位换算比例
     */
    getPixelsToUnitHorizontal(distance?: number, options: ConversionOptions = {}): number {
        const useCache = options.useCache ?? true;
        const cacheKey = this.getCacheKey('horizontal', distance);

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const { width, height } = this.getContainerSize();
        if (width === 0) {
            console.error('Container width is zero');
            return 0;
        }

        const dist = this.validateDistance(distance);
        let ratio: number;

        if (this.camera instanceof PerspectiveCamera) {
            // Perspective Camera
            // 透视相机
            const vFov = this.camera.fov * Math.PI / 180;
            const aspect = width / height;
            const visibleWidth = 2 * Math.tan(vFov / 2) * dist * aspect;
            ratio = visibleWidth / width;
        } else if (this.camera instanceof OrthographicCamera) {
            // Orthographic Camera
            // 正交相机
            const visibleWidth = this.camera.right - this.camera.left;
            ratio = visibleWidth / width;
        } else {
            console.warn('Unsupported camera type, using fallback calculation');
            ratio = 1 / width;
        }

        if (useCache) {
            this.cache.set(cacheKey, ratio);
        }

        return ratio;
    }

    /**
     * 将像素尺寸转换为世界单位（垂直方向）
     */
    pixelsToUnits(pixels: number, distance?: number, options: ConversionOptions = {}): number {
        return pixels * this.getPixelsToUnit(distance, options);
    }

    /**
     * 将像素尺寸转换为世界单位（水平方向）
     */
    pixelsToUnitsHorizontal(pixels: number, distance?: number, options: ConversionOptions = {}): number {
        return pixels * this.getPixelsToUnitHorizontal(distance, options);
    }

    /**
     * 将世界单位转换为像素尺寸（垂直方向）
     */
    unitsToPixels(units: number, distance?: number, options: ConversionOptions = {}): number {
        const ratio = this.getPixelsToUnit(distance, options);
        return ratio !== 0 ? units / ratio : 0;
    }

    /**
     * 将世界单位转换为像素尺寸（水平方向）
     */
    unitsToPixelsHorizontal(units: number, distance?: number, options: ConversionOptions = {}): number {
        const ratio = this.getPixelsToUnitHorizontal(distance, options);
        return ratio !== 0 ? units / ratio : 0;
    }

    /**
     * 获取指定距离处的可见区域尺寸
     */
    getVisibleSizeAtDistance(distance?: number): { width: number; height: number } {
        const dist = this.validateDistance(distance);
        const { width, height } = this.getContainerSize();

        if (this.camera instanceof PerspectiveCamera) {
            const vFov = this.camera.fov * Math.PI / 180;
            const aspect = width / height;
            const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
            const visibleWidth = visibleHeight * aspect;

            return { width: visibleWidth, height: visibleHeight };
        } else {
            const camera = this.camera as OrthographicCamera;
            return {
                width: camera.right - camera.left,
                height: camera.top - camera.bottom
            };
        }
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * 手动触发尺寸更新（当非ResizeObserver监听到的变化时使用）
     */
    update(): void {
        this.clearCache();
    }
}

export { PixelUnitConverter, type ConversionOptions };