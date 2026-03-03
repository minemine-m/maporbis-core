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
export class PerformanceMonitor {
    // Performance data storage 性能数据存储
    private frameStats: Map<number, IFrameStats> = new Map();
    private summaryStats: ISummaryStats = {
        totalFrames: 0,
        averageFrameTime: 0,
        averageFPS: 0,
        minFrameTime: Infinity,
        maxFrameTime: 0,
        totalFeaturesProcessed: 0
    };
    
    // Real-time monitoring window (recent N frames) 实时监控窗口（最近N帧）
    private readonly sampleWindowSize = 60; // Keep recent 60 frames 保留最近60帧数据
    private currentFrameId: number = 0;
    private lastReportTime: number = 0;
    private reportInterval: number = 5000; // Report every 5 seconds 5秒报告一次
    
    // Performance threshold configuration 性能阈值配置
    private readonly performanceThresholds = {
        criticalFrameTime: 33,   // < 30fps is critical 30fps以下为严重
        warningFrameTime: 16,    // < 60fps is warning 60fps以下为警告
        idealFrameTime: 8        // > 120fps is ideal 120fps以上为理想
    };
    
    constructor() {
        this.lastReportTime = Date.now();
    }
    
    /**
     * Start monitoring a frame
     * 开始一帧的性能监控
     * 
     * @param frameId Frame ID
     *                帧ID
     */
    startFrame(frameId: number): void {
        this.currentFrameId = frameId;
        
        const frameStat: IFrameStats = {
            frameId,
            startTime: performance.now(),
            endTime: 0,
            duration: 0,
            featureCount: 0,
            visibleCount: 0,
            hiddenCount: 0,
            collisionChecks: 0,
            memoryUsage: 0,
            strategyTimes: new Map()
        };
        
        this.frameStats.set(frameId, frameStat);
        
        // Clean up expired frame data
        // 清理过期的帧数据
        this.cleanupOldFrames();
    }
    
    /**
     * End monitoring a frame
     * 结束一帧的性能监控
     * 
     * @param frameId Frame ID
     *                帧ID
     * @param additionalStats Additional statistics
     *                        附加统计信息
     */
    endFrame(frameId: number, additionalStats?: IFrameAdditionalStats): void {
        const frameStat = this.frameStats.get(frameId);
        if (!frameStat) return;
        
        const endTime = performance.now();
        frameStat.endTime = endTime;
        frameStat.duration = endTime - frameStat.startTime;
        
        // Update additional statistics
        // 更新附加统计信息
        if (additionalStats) {
            Object.assign(frameStat, additionalStats);
        }
        
        // Update memory usage (if available)
        // 更新内存使用情况（如果可用）
        if ('memory' in performance) {
            // @ts-ignore
            frameStat.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // Update summary statistics
        // 更新汇总统计
        this.updateSummaryStats(frameStat);
        
        // Periodically output performance report
        // 定期输出性能报告
        this.maybeOutputReport();
    }
    
    /**
     * Record strategy execution time
     * 记录策略执行时间
     * 
     * @param strategyName Strategy name
     *                     策略名称
     * @param executionTime Execution time (ms)
     *                      执行时间（毫秒）
     */
    recordStrategyTime(strategyName: string, executionTime: number): void {
        const frameStat = this.frameStats.get(this.currentFrameId);
        if (frameStat) {
            frameStat.strategyTimes.set(strategyName, executionTime);
        }
    }
    
    /**
     * Record collision check count
     * 记录碰撞检测次数
     * 
     * @param checkCount Check count
     *                   检测次数
     */
    recordCollisionChecks(checkCount: number): void {
        const frameStat = this.frameStats.get(this.currentFrameId);
        if (frameStat) {
            frameStat.collisionChecks += checkCount;
        }
    }
    
    /**
     * Get performance statistics summary
     * 获取性能统计摘要
     */
    getStats(): IPerformanceStats {
        const recentFrames = this.getRecentFrames(this.sampleWindowSize);
        const fps = this.calculateFPS(recentFrames);
        const frameTime = this.calculateAverageFrameTime(recentFrames);
        
        return {
            summary: { ...this.summaryStats },
            recent: {
                fps,
                frameTime,
                frameTimeStdDev: this.calculateFrameTimeStdDev(recentFrames),
                averageFeaturesPerFrame: this.calculateAverageFeatures(recentFrames),
                performanceLevel: this.getPerformanceLevel(frameTime)
            },
            currentFrame: this.frameStats.get(this.currentFrameId) || null,
            strategies: this.getStrategyPerformance(recentFrames),
            warnings: this.getPerformanceWarnings(recentFrames)
        };
    }
    
    /**
     * Get detailed performance report
     * 获取性能报告（包含详细分析）
     */
    getDetailedReport(): IDetailedPerformanceReport {
        const recentFrames = this.getRecentFrames(this.sampleWindowSize);
        const stats = this.getStats();
        
        return {
            ...stats,
            frameHistory: Array.from(recentFrames.values()),
            trends: this.calculateTrends(recentFrames),
            recommendations: this.getPerformanceRecommendations(stats)
        };
    }
    
    /**
     * Reset all statistics
     * 重置所有统计
     */
    reset(): void {
        this.frameStats.clear();
        this.summaryStats = {
            totalFrames: 0,
            averageFrameTime: 0,
            averageFPS: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            totalFeaturesProcessed: 0
        };
        this.currentFrameId = 0;
        this.lastReportTime = Date.now();
    }
    
    // ===== 私有方法 =====
    
    private cleanupOldFrames(): void {
        if (this.frameStats.size > this.sampleWindowSize * 2) {
            const framesToDelete = Array.from(this.frameStats.keys())
                .sort((a, b) => a - b)
                .slice(0, this.frameStats.size - this.sampleWindowSize);
            
            framesToDelete.forEach(frameId => {
                this.frameStats.delete(frameId);
            });
        }
    }
    
    private updateSummaryStats(frameStat: IFrameStats): void {
        this.summaryStats.totalFrames++;
        this.summaryStats.totalFeaturesProcessed += frameStat.featureCount || 0;
        
        // 更新平均帧时间（滑动平均）
        this.summaryStats.averageFrameTime = 
            (this.summaryStats.averageFrameTime * (this.summaryStats.totalFrames - 1) + frameStat.duration) 
            / this.summaryStats.totalFrames;
        
        // 更新帧时间极值
        this.summaryStats.minFrameTime = Math.min(this.summaryStats.minFrameTime, frameStat.duration);
        this.summaryStats.maxFrameTime = Math.max(this.summaryStats.maxFrameTime, frameStat.duration);
        
        // 更新平均FPS
        this.summaryStats.averageFPS = 1000 / this.summaryStats.averageFrameTime;
    }
    
    private maybeOutputReport(): void {
        const now = Date.now();
        if (now - this.lastReportTime >= this.reportInterval) {
            const stats = this.getStats();
            if (stats.warnings.length > 0) {
                console.warn('避让系统性能报告:', stats);
            } else {
                console.log('避让系统性能正常:', stats);
            }
            this.lastReportTime = now;
        }
    }
    
    private getRecentFrames(count: number): IFrameStats[] {
        const frames = Array.from(this.frameStats.values());
        return frames.slice(-count).filter(frame => frame.duration > 0);
    }
    
    private calculateFPS(frames: IFrameStats[]): number {
        if (frames.length === 0) return 0;
        const avgFrameTime = this.calculateAverageFrameTime(frames);
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }
    
    private calculateAverageFrameTime(frames: IFrameStats[]): number {
        if (frames.length === 0) return 0;
        return frames.reduce((sum, frame) => sum + frame.duration, 0) / frames.length;
    }
    
    private calculateFrameTimeStdDev(frames: IFrameStats[]): number {
        if (frames.length === 0) return 0;
        const mean = this.calculateAverageFrameTime(frames);
        const squareDiffs = frames.map(frame => Math.pow(frame.duration - mean, 2));
        return Math.sqrt(squareDiffs.reduce((sum, diff) => sum + diff, 0) / frames.length);
    }
    
    private calculateAverageFeatures(frames: IFrameStats[]): number {
        if (frames.length === 0) return 0;
        return frames.reduce((sum, frame) => sum + (frame.featureCount || 0), 0) / frames.length;
    }
    
    private getPerformanceLevel(frameTime: number): PerformanceLevel {
        if (frameTime > this.performanceThresholds.criticalFrameTime) {
            return 'critical';
        } else if (frameTime > this.performanceThresholds.warningFrameTime) {
            return 'warning';
        } else if (frameTime > this.performanceThresholds.idealFrameTime) {
            return 'good';
        } else {
            return 'excellent';
        }
    }
    
    private getStrategyPerformance(frames: IFrameStats[]): IStrategyPerformance[] {
        const strategyTimes = new Map<string, number[]>();
        
        frames.forEach(frame => {
            frame.strategyTimes.forEach((time, strategyName) => {
                if (!strategyTimes.has(strategyName)) {
                    strategyTimes.set(strategyName, []);
                }
                strategyTimes.get(strategyName)!.push(time);
            });
        });
        
        return Array.from(strategyTimes.entries()).map(([name, times]) => ({
            name,
            averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
            maxTime: Math.max(...times),
            minTime: Math.min(...times),
            callCount: times.length
        }));
    }
    
    private getPerformanceWarnings(frames: IFrameStats[]): IPerformanceWarning[] {
        const warnings: IPerformanceWarning[] = [];
        const recentFrames = frames.slice(-30); // 最近30帧
        
        if (recentFrames.length === 0) return warnings;
        
        const avgFrameTime = this.calculateAverageFrameTime(recentFrames);
        
        // 帧率警告
        if (avgFrameTime > this.performanceThresholds.criticalFrameTime) {
            warnings.push({
                type: 'critical',
                message: `帧率过低: ${Math.round(1000 / avgFrameTime)}fps`,
                suggestion: '考虑减少要素数量或简化避让策略'
            });
        } else if (avgFrameTime > this.performanceThresholds.warningFrameTime) {
            warnings.push({
                type: 'warning', 
                message: `帧率较低: ${Math.round(1000 / avgFrameTime)}fps`,
                suggestion: '建议优化避让算法或增加更新间隔'
            });
        }
        
        // 内存警告
        const recentMemory = recentFrames
            .map(f => f.memoryUsage)
            .filter(usage => usage > 0);
        
        if (recentMemory.length > 0) {
            const avgMemory = recentMemory.reduce((sum, mem) => sum + mem, 0) / recentMemory.length;
            if (avgMemory > 100 * 1024 * 1024) { // 100MB
                warnings.push({
                    type: 'warning',
                    message: `内存使用较高: ${(avgMemory / 1024 / 1024).toFixed(1)}MB`,
                    suggestion: '检查内存泄漏，及时清理无用资源'
                });
            }
        }
        
        return warnings;
    }
    
    private calculateTrends(frames: IFrameStats[]): IPerformanceTrends {
        if (frames.length < 2) return { frameTime: 'stable', fps: 'stable', features: 'stable' };
        
        const firstHalf = frames.slice(0, Math.floor(frames.length / 2));
        const secondHalf = frames.slice(Math.floor(frames.length / 2));
        
        const avgFirst = this.calculateAverageFrameTime(firstHalf);
        const avgSecond = this.calculateAverageFrameTime(secondHalf);
        
        const change = ((avgSecond - avgFirst) / avgFirst) * 100;
        
        return {
            frameTime: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'worsening' : 'improving',
            fps: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'improving' : 'worsening',
            features: 'stable' // 可根据实际情况计算
        };
    }
    
    private getPerformanceRecommendations(stats: IPerformanceStats): string[] {
        const recommendations: string[] = [];
        
        if (stats.recent.performanceLevel === 'critical') {
            recommendations.push('建议启用要素抽样或聚合显示');
            recommendations.push('考虑增加避让更新间隔时间');
            recommendations.push('检查是否有不必要的避让策略');
        }
        
        if (stats.recent.averageFeaturesPerFrame > 5000) {
            recommendations.push('要素数量过多，建议启用LOD分级');
        }
        
        // 分析策略性能
        stats.strategies.forEach(strategy => {
            if (strategy.averageTime > 10) {
                recommendations.push(`策略 "${strategy.name}" 执行时间较长，考虑优化`);
            }
        });
        
        return recommendations;
    }
}

// ===== 类型定义 =====

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