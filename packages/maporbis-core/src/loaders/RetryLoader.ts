/**
 * Retry configuration
 * 重试配置
 */
export interface RetryOptions {
    /** Maximum retry attempts (default: 2) 最大重试次数 */
    maxRetries?: number;
    /** Base delay in ms (default: 100) 基础延迟毫秒 */
    baseDelay?: number;
    /** Max delay in ms (default: 2000) 最大延迟毫秒 */
    maxDelay?: number;
}

/**
 * Retry Loader Wrapper
 * 重试加载器包装器
 * @description Wraps any loader with automatic retry logic using exponential backoff.
 *              包装任何加载器，添加自动重试逻辑（指数退避）。
 */
export class RetryLoader<T> {
    private _loader: (context: any) => Promise<T>;
    private _maxRetries: number;
    private _baseDelay: number;
    private _maxDelay: number;

    constructor(
        loader: (context: any) => Promise<T>,
        options: RetryOptions = {}
    ) {
        this._loader = loader;
        this._maxRetries = options.maxRetries ?? 2;
        this._baseDelay = options.baseDelay ?? 100;
        this._maxDelay = options.maxDelay ?? 2000;
    }

    /**
     * Load with retry
     * 带重试的加载
     */
    public async load(context: any): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
            try {
                return await this._loader(context);
            } catch (error) {
                lastError = error as Error;

                if (attempt < this._maxRetries) {
                    const delay = this._calculateDelay(attempt);
                    console.warn(
                        `[RetryLoader] Load failed (attempt ${attempt + 1}/${this._maxRetries + 1}), ` +
                        `retrying in ${delay}ms...`,
                        context
                    );
                    await this._sleep(delay);
                }
            }
        }

        // All retries failed
        console.error(
            `[RetryLoader] Load failed after ${this._maxRetries + 1} attempts`,
            lastError
        );
        throw lastError;
    }

    /**
     * Calculate delay with exponential backoff
     * 计算指数退避延迟
     */
    private _calculateDelay(attempt: number): number {
        const delay = this._baseDelay * Math.pow(2, attempt);
        return Math.min(delay, this._maxDelay);
    }

    private _sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Get max retries 获取最大重试次数 */
    public get maxRetries(): number {
        return this._maxRetries;
    }

    /** Set max retries 设置最大重试次数 */
    public set maxRetries(value: number) {
        this._maxRetries = Math.max(0, value);
    }
}
