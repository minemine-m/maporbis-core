import { ICollisionStrategy } from './interfaces/ICollisionStrategy';
import { ICollidable } from './interfaces/ICollidable';
import { ICollisionContext, ICollisionResult, CollisionReason } from './types/CollisionTypes';

/**
 * Strategy Orchestrator
 * 策略协调器
 * 
 * @description
 * Responsible for managing and coordinating the execution order of multiple collision detection strategies.
 * Executes strategies sequentially in the order they were registered and merges the execution results.
 * 负责管理和协调多个碰撞检测策略的执行顺序，
 * 按照注册顺序依次执行各个策略，并合并策略执行结果
 * 
 * @example
 * ```typescript
 * const orchestrator = new StrategyOrchestrator();
 * orchestrator.registerStrategy(new PriorityCollisionStrategy(), 0);
 * orchestrator.registerStrategy(new ProximityCollisionStrategy(), 1);
 * const results = await orchestrator.executeStrategies(features, context);
 * ```
  * @category Core
 */
export class StrategyOrchestrator {
    /** 
     * Registered strategies map (strategy name -> strategy instance)
     * 已注册的策略映射表（策略名称 -> 策略实例） 
     */
    private _strategies: Map<string, ICollisionStrategy> = new Map();
    
    /** 
     * Strategy execution order array
     * 策略执行顺序数组 
     */
    private _executionOrder: string[] = [];
    
    /**
     * Register collision detection strategy
     * 注册碰撞检测策略
     * 
     * @param strategy - Strategy instance to register
     *                   要注册的策略实例
     * @param order - Strategy execution order (insertion index), appended to end if not specified
     *                策略执行顺序（插入位置），如未指定则添加到队列末尾
     * @returns Current orchestrator instance (supports method chaining)
     *          当前协调器实例（支持链式调用）
     * 
     * @example
     * ```typescript
     * // Add to beginning
     * // 添加到首位
     * orchestrator.registerStrategy(strategy1, 0);
     * // Add to end
     * // 添加到末尾
     * orchestrator.registerStrategy(strategy2);
     * // Insert at specific position
     * // 插入到指定位置
     * orchestrator.registerStrategy(strategy3, 1);
     * ```
     */
    registerStrategy(strategy: ICollisionStrategy, order?: number): this {
        this._strategies.set(strategy.name, strategy);
        
        if (order !== undefined) {
            this._executionOrder.splice(order, 0, strategy.name);
        } else {
            this._executionOrder.push(strategy.name);
        }
        
        return this;
    }
    
    /**
     * Execute all registered strategies
     * 执行所有已注册的策略
     * 
     * @description
     * Executes collision detection strategies sequentially in registration order. The results of each strategy are merged into the final result.
     * If a feature is marked as hidden in a previous strategy, subsequent strategies will skip processing that feature.
     * 按照注册顺序依次执行各个碰撞检测策略，每个策略的执行结果会合并到最终结果中。
     * 如果某个要素在前面的策略中已经被标记为隐藏，后续策略将不再处理该要素。
     * 
     * @param features - Array of features to process
     *                   要处理的要素数组
     * @param context - Collision detection context information
     *                  碰撞检测上下文信息
     * @returns Promise containing map of all feature processing results
     *          Promise 包含所有要素处理结果的映射表
     * 
     * @example
     * ```typescript
     * const results = await orchestrator.executeStrategies(features, context);
     * results.forEach((result, featureId) => {
     *   console.log(`Feature ${featureId}: ${result.visible ? 'Visible' : 'Hidden'}`);
     * });
     * ```
     */
    async executeStrategies(features: ICollidable[], context: ICollisionContext): Promise<Map<string, ICollisionResult>> {
        const results = new Map<string, ICollisionResult>();
        
        // Initialize all features as visible
        // 初始化所有要素为可见
        features.forEach(feature => {
            results.set(feature._id, {
                featureId: feature._id,
                visible: true,
                reason: CollisionReason.NO_COLLISION,
                collidedWith: [],
                timestamp: context.timestamp
            });
        });
        
        // Execute strategies in order
        // 按顺序执行策略
        for (const strategyName of this._executionOrder) {
            const strategy = this._strategies.get(strategyName);
            if (!strategy?.enabled) continue;
            
            try {
                const strategyResults = await strategy.execute(features, context, results);
                this._mergeResults(results, strategyResults);
            } catch (error) {
                console.error(`Strategy ${strategyName} execution failed: 策略 ${strategyName} 执行失败:`, error);
            }
        }
        
        return results;
    }
    
    /**
     * Merge strategy execution results
     * 合并策略执行结果
     * 
     * @description
     * Merges new strategy results into base results, following the "once hidden, always hidden" principle:
     * If a feature was marked hidden in a previous strategy, subsequent strategy results for it are ignored.
     * 将新策略的执行结果合并到基础结果中，遵循"一旦隐藏，永远隐藏"的原则：
     * 如果要素在之前策略中已经被标记为隐藏，后续策略的结果将被忽略
     * 
     * @param baseResults - Base results map (will be modified)
     *                      基础结果映射表（会被修改）
     * @param newResults - Array of results from new strategy
     *                     新策略产生的结果数组
     */
    private _mergeResults(baseResults: Map<string, ICollisionResult>, newResults: ICollisionResult[]): void {
        newResults.forEach(newResult => {
            const existing = baseResults.get(newResult.featureId);
            if (existing && !existing.visible) {
                // Keep hidden if previously decided to hide
                // 如果之前已经决定隐藏，保持隐藏状态
                return;
            }
            baseResults.set(newResult.featureId, newResult);
        });
    }
}