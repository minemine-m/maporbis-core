import { Object3D } from 'three';
import { Line2 } from 'three-stdlib';
import { Paint, PaintInput } from '../../style/index';
/**
 * Internal feature paint queue manager.
 * 内部要素样式队列管理器
 *
 * @description
 * Handles asynchronous paint application with queue mechanism and retry logic.
 * 处理带有队列机制和重试逻辑的异步样式应用
 *
 * @internal
 */
export declare class FeaturePaintManager {
    /** Paint queue for handling asynchronous paint application. 样式队列（用于处理异步样式应用） */
    private _paintQueue;
    /** Whether paint is currently being applied. 是否正在应用样式 */
    private _isApplyingPaint;
    /** Current paint instance. 当前样式实例 */
    private _currentPaint?;
    /** Callback when paint is applied successfully. 样式成功应用后的回调 */
    private _onPaintApplied?;
    /** Render object getter. 渲染对象获取器 */
    private _getRenderObject;
    /** Add render object to parent. 将渲染对象添加到父级 */
    private _addRenderObject;
    /**
     * Create a paint manager instance.
     * 创建样式管理器实例
     *
     * @param getRenderObject - Function to get current render object. 获取当前渲染对象的函数
     * @param addRenderObject - Function to add render object to parent. 添加渲染对象到父级的函数
     */
    constructor(getRenderObject: () => Object3D | Line2 | null, addRenderObject: () => void);
    /**
     * Set callback for when paint is applied.
     * 设置样式应用后的回调
     *
     * @param callback - Callback function. 回调函数
     */
    setOnPaintApplied(callback: (paint: Paint) => void): void;
    /**
     * Get current paint.
     * 获取当前样式
     *
     * @returns Current paint or undefined. 当前样式或undefined
     */
    getCurrentPaint(): Paint | undefined;
    /**
     * Enqueue a paint for application.
     * 将样式加入应用队列
     *
     * @param input - Paint configuration or paint instance. 样式配置或样式实例
     * @returns The paint instance. 样式实例
     */
    enqueuePaint(input: PaintInput): Paint;
    /**
     * Check if paint queue can be processed.
     * 检查样式队列是否可以处理
     *
     * @returns Whether processing should start. 是否应该开始处理
     */
    canProcessQueue(): boolean;
    /**
     * Try to process the paint queue.
     * 尝试处理样式队列
     */
    _tryProcessPaintQueue(): void;
    /**
     * Process the paint queue sequentially.
     * 按顺序处理样式队列
     */
    private _processPaintQueue;
    /**
     * Apply paint with retry mechanism.
     * 应用样式（带重试机制）
     *
     * @param paint - Paint instance. 样式实例
     * @param renderObject - Render object to apply paint to. 要应用样式的渲染对象
     * @param maxRetries - Maximum retries (default: 3). 最大重试次数（默认3）
     * @param baseDelay - Base delay in ms (default: 100). 基础延迟时间（毫秒，默认100）
     */
    private _applyPaintWithRetry;
    /**
     * Check if paint is being applied.
     * 检查是否正在应用样式
     */
    get isApplyingPaint(): boolean;
    /**
     * Check if there are pending paints.
     * 检查是否有待处理的样式
     */
    get hasPendingPaints(): boolean;
}
