/**
 * WebGPU Compatibility Utility
 * WebGPU 兼容性工具
 */
export declare const WebGPUCompat: {
    /**
     * Check if WebGPU is available in the browser
     * 检查当前环境是否支持 WebGPU
     */
    isAvailable: () => Promise<boolean>;
    /**
     * Global flag to indicate if the app is currently using WebGPURenderer
     * 全局标志，指示当前应用是否正在使用 WebGPU 渲染器
     */
    useWebGPU: boolean;
    /**
     * Set the WebGPU usage flag
     * 设置 WebGPU 使用状态
     */
    setUseWebGPU: (value: boolean) => void;
    /**
     * Safe dispose resource for WebGPU/WebGL
     * 安全销毁资源（兼容 WebGPU/WebGL）
     *
     * @param disposeCallback Callback function to execute actual disposal logic. 执行实际销毁逻辑的回调函数。
     */
    safeDispose: (disposeCallback: () => void) => void;
};
