/**
 * Performance Monitor
 * 性能监控器
 *
 * @description
 * Monitors collision avoidance system performance metrics, including:
 * - Frame rate statistics
 * - Execution time analysis
 * - Memory usage
 * - Feature count statistics
 *
 * Provides real-time performance data and historical trend analysis.
 * 用于监控避让系统的性能指标，包括：
 * - 帧率统计
 * - 执行时间分析
 * - 内存使用情况
 * - 要素数量统计
 *
 * 提供实时性能数据和历史趋势分析
  * @category Core
 */
export declare class PerformanceMonitor {
    private frameStats;
    private summaryStats;
    private readonly sampleWindowSize;
    private currentFrameId;
    private lastReportTime;
    private reportInterval;
    private readonly performanceThresholds;
    constructor();
    /**
     * Start monitoring a frame
     * 开始一帧的性能监控
     *
     * @param frameId Frame ID
     *                帧ID
     */
    startFrame(frameId: number): void;
    /**
     * End monitoring a frame
     * 结束一帧的性能监控
     *
     * @param frameId Frame ID
     *                帧ID
     * @param additionalStats Additional statistics
     *                        附加统计信息
     */
    endFrame(frameId: number, additionalStats?: IFrameAdditionalStats): void;
    /**
     * Record strategy execution time
     * 记录策略执行时间
     *
     * @param strategyName Strategy name
     *                     策略名称
     * @param executionTime Execution time (ms)
     *                      执行时间（毫秒）
     */
    recordStrategyTime(strategyName: string, executionTime: number): void;
    /**
     * Record collision check count
     * 记录碰撞检测次数
     *
     * @param checkCount Check count
     *                   检测次数
     */
    recordCollisionChecks(checkCount: number): void;
    /**
     * Get performance statistics summary
     * 获取性能统计摘要
     */
    getStats(): IPerformanceStats;
    /**
     * Get detailed performance report
     * 获取性能报告（包含详细分析）
     */
    getDetailedReport(): IDetailedPerformanceReport;
    /**
     * Reset all statistics
     * 重置所有统计
     */
    reset(): void;
    private cleanupOldFrames;
    private updateSummaryStats;
    private maybeOutputReport;
    private getRecentFrames;
    private calculateFPS;
    private calculateAverageFrameTime;
    private calculateFrameTimeStdDev;
    private calculateAverageFeatures;
    private getPerformanceLevel;
    private getStrategyPerformance;
    private getPerformanceWarnings;
    private calculateTrends;
    private getPerformanceRecommendations;
}
/**
 * @category Core
 */
export interface IFrameStats {
    frameId: number;
    startTime: number;
    endTime: number;
    duration: number;
    featureCount?: number;
    visibleCount?: number;
    hiddenCount?: number;
    collisionChecks: number;
    memoryUsage: number;
    strategyTimes: Map<string, number>;
}
/**
 * @category Core
 */
export interface IFrameAdditionalStats {
    featureCount: number;
    visibleCount: number;
    hiddenCount: number;
}
/**
 * @category Core
 */
export interface ISummaryStats {
    totalFrames: number;
    averageFrameTime: number;
    averageFPS: number;
    minFrameTime: number;
    maxFrameTime: number;
    totalFeaturesProcessed: number;
}
/**
 * @category Core
 */
export interface IPerformanceStats {
    summary: ISummaryStats;
    recent: {
        fps: number;
        frameTime: number;
        frameTimeStdDev: number;
        averageFeaturesPerFrame: number;
        performanceLevel: PerformanceLevel;
    };
    currentFrame: IFrameStats | null;
    strategies: IStrategyPerformance[];
    warnings: IPerformanceWarning[];
}
/**
 * @category Core
 */
export interface IStrategyPerformance {
    name: string;
    averageTime: number;
    maxTime: number;
    minTime: number;
    callCount: number;
}
/**
 * @category Core
 */
export interface IPerformanceWarning {
    type: 'warning' | 'critical';
    message: string;
    suggestion: string;
}
/**
 * @category Core
 */
export interface IPerformanceTrends {
    frameTime: 'improving' | 'worsening' | 'stable';
    fps: 'improving' | 'worsening' | 'stable';
    features: 'improving' | 'worsening' | 'stable';
}
/**
 * @category Core
 */
export type PerformanceLevel = 'excellent' | 'good' | 'warning' | 'critical';
/**
 * @category Core
 */
export interface IDetailedPerformanceReport extends IPerformanceStats {
    frameHistory: IFrameStats[];
    trends: IPerformanceTrends;
    recommendations: string[];
}
