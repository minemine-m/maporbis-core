/**
 * WebGPU Compatibility Utility
 * WebGPU 兼容性工具
 */
export const WebGPUCompat = {
    /**
     * Check if WebGPU is available in the browser
     * 检查当前环境是否支持 WebGPU
     */
    isAvailable: async () => {
        if (!navigator.gpu)
            return false;
        try {
            const adapter = await navigator.gpu.requestAdapter();
            return !!adapter;
        }
        catch (e) {
            console.warn('WebGPU detection failed:', e);
            return false;
        }
    },
    /**
     * Global flag to indicate if the app is currently using WebGPURenderer
     * 全局标志，指示当前应用是否正在使用 WebGPU 渲染器
     */
    useWebGPU: false,
    /**
     * Set the WebGPU usage flag
     * 设置 WebGPU 使用状态
     */
    setUseWebGPU: (value) => {
        WebGPUCompat.useWebGPU = value;
    },
    /**
     * Safe dispose resource for WebGPU/WebGL
     * 安全销毁资源（兼容 WebGPU/WebGL）
     *
     * @param disposeCallback Callback function to execute actual disposal logic. 执行实际销毁逻辑的回调函数。
     */
    safeDispose: (disposeCallback) => {
        if (WebGPUCompat.useWebGPU) {
            // Delay disposal for WebGPU to avoid "Buffer used in submit while destroyed" error
            // 延迟 WebGPU 下的销毁，避免 "Buffer used in submit while destroyed" 错误
            // Use requestAnimationFrame to wait for a few frames (e.g., 10 frames) to ensure
            // that the GPU has finished processing commands referencing these buffers.
            // 使用 requestAnimationFrame 等待几帧（例如 10 帧），确保 GPU 已完成处理引用这些缓冲区的命令。
            let frameCount = 0;
            const waitFrames = () => {
                frameCount++;
                if (frameCount < 10) {
                    requestAnimationFrame(waitFrames);
                }
                else {
                    try {
                        disposeCallback();
                    }
                    catch (e) {
                        console.error('Error during WebGPU deferred disposal:', e);
                    }
                }
            };
            requestAnimationFrame(waitFrames);
        }
        else {
            // WebGL mode: dispose immediately
            // WebGL 模式：立即销毁
            try {
                disposeCallback();
            }
            catch (e) {
                console.error('Error during WebGL disposal:', e);
            }
        }
    }
};
