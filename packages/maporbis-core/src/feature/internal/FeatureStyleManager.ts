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
export class FeaturePaintManager {
    /** Paint queue for handling asynchronous paint application. 样式队列（用于处理异步样式应用） */
    private _paintQueue: PaintInput[] = [];
    
    /** Whether paint is currently being applied. 是否正在应用样式 */
    private _isApplyingPaint = false;
    
    /** Current paint instance. 当前样式实例 */
    private _currentPaint?: Paint;
    
    /** Callback when paint is applied successfully. 样式成功应用后的回调 */
    private _onPaintApplied?: (paint: Paint) => void;
    
    /** Render object getter. 渲染对象获取器 */
    private _getRenderObject: () => Object3D | Line2 | null;
    
    /** Add render object to parent. 将渲染对象添加到父级 */
    private _addRenderObject: () => void;

    /**
     * Create a paint manager instance.
     * 创建样式管理器实例
     * 
     * @param getRenderObject - Function to get current render object. 获取当前渲染对象的函数
     * @param addRenderObject - Function to add render object to parent. 添加渲染对象到父级的函数
     */
    constructor(
        getRenderObject: () => Object3D | Line2 | null,
        addRenderObject: () => void
    ) {
        this._getRenderObject = getRenderObject;
        this._addRenderObject = addRenderObject;
    }

    /**
     * Set callback for when paint is applied.
     * 设置样式应用后的回调
     * 
     * @param callback - Callback function. 回调函数
     */
    setOnPaintApplied(callback: (paint: Paint) => void): void {
        this._onPaintApplied = callback;
    }

    /**
     * Get current paint.
     * 获取当前样式
     * 
     * @returns Current paint or undefined. 当前样式或undefined
     */
    getCurrentPaint(): Paint | undefined {
        return this._currentPaint;
    }

    /**
     * Enqueue a paint for application.
     * 将样式加入应用队列
     * 
     * @param input - Paint configuration or paint instance. 样式配置或样式实例
     * @returns The paint instance. 样式实例
     */
    enqueuePaint(input: PaintInput): Paint {
        const paint = input instanceof Paint ? input : new Paint(input);
        this._currentPaint = paint;
        const configCopy = JSON.parse(JSON.stringify(paint.config));
        this._paintQueue.push(configCopy);
        this._tryProcessPaintQueue();
        return paint;
    }

    /**
     * Check if paint queue can be processed.
     * 检查样式队列是否可以处理
     * 
     * @returns Whether processing should start. 是否应该开始处理
     */
    canProcessQueue(): boolean {
        const renderObject = this._getRenderObject();
        return (
            renderObject !== null &&
            !this._isApplyingPaint &&
            this._paintQueue.length > 0
        );
    }

    /**
     * Try to process the paint queue.
     * 尝试处理样式队列
     */
    _tryProcessPaintQueue(): void {
        if (this.canProcessQueue()) {
            this._processPaintQueue()
                .catch((error) => {
                    this._isApplyingPaint = false;
                    this._tryProcessPaintQueue();
                    console.warn('Paint application failed:', error);
                });
        }
    }

    /**
     * Process the paint queue sequentially.
     * 按顺序处理样式队列
     */
    private async _processPaintQueue(): Promise<void> {
        const renderObject = this._getRenderObject();
        if (!renderObject || this._isApplyingPaint || this._paintQueue.length === 0) {
            return;
        }

        this._isApplyingPaint = true;
        const currentPaint = this._paintQueue[0];

        try {
            const paintInstance = new Paint(JSON.parse(JSON.stringify(currentPaint)));
            await this._applyPaintWithRetry(paintInstance, renderObject);
            this._paintQueue.shift();
            
            if (this._paintQueue.length > 0) {
                await this._processPaintQueue();
            }
        } catch (error) {
            throw error;
        } finally {
            this._isApplyingPaint = false;
            if (this._paintQueue.length > 0) {
                this._tryProcessPaintQueue();
            }
        }
    }

    /**
     * Apply paint with retry mechanism.
     * 应用样式（带重试机制）
     * 
     * @param paint - Paint instance. 样式实例
     * @param renderObject - Render object to apply paint to. 要应用样式的渲染对象
     * @param maxRetries - Maximum retries (default: 3). 最大重试次数（默认3）
     * @param baseDelay - Base delay in ms (default: 100). 基础延迟时间（毫秒，默认100）
     */
    private async _applyPaintWithRetry(
        paint: Paint,
        renderObject: Object3D | Line2,
        maxRetries: number = 3,
        baseDelay: number = 100
    ): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!renderObject.parent) {
                    this._addRenderObject();
                    await new Promise(r => requestAnimationFrame(r));
                }
                await paint.applyTo(renderObject);
                
                // Notify that paint was applied
                if (this._onPaintApplied) {
                    this._onPaintApplied(paint);
                }
                
                return;
            } catch (error) {
                lastError = error as Error;
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        throw lastError || new Error('Paint application failed after retries');
    }

    /**
     * Check if paint is being applied.
     * 检查是否正在应用样式
     */
    get isApplyingPaint(): boolean {
        return this._isApplyingPaint;
    }

    /**
     * Check if there are pending paints.
     * 检查是否有待处理的样式
     */
    get hasPendingPaints(): boolean {
        return this._paintQueue.length > 0;
    }
}
