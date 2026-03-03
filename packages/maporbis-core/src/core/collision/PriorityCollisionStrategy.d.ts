import { ICollisionContext, ICollisionResult } from './types/CollisionTypes';
import { ICollidable } from './interfaces/ICollidable';
import { ICollisionStrategy } from './interfaces/ICollisionStrategy';
/**
 * Priority-based collision avoidance strategy
 * 基于优先级的避让策略
 *
 * @description
 * This strategy uses QuadTree for spatial indexing and processes features in priority order:
 * 1. Features with smaller priority values are more important and displayed first
 * 2. When collision occurs, only the highest priority feature is displayed
 * 3. Lower priority features colliding with higher ones are hidden
 *
 * 该策略通过四叉树进行空间索引，按照优先级顺序处理要素：
 * 1. 优先级数值越小的要素越重要，优先显示
 * 2. 当要素发生碰撞时，只显示优先级最高的要素
 * 3. 隐藏被碰撞的较低优先级要素
 *
 * Applicable scenarios:
 * - Point layers, label layers where features need to be displayed by importance
 * - Scenarios with moderate feature count (100-5000)
 *
 * 适用场景：
 * - 点图层、标注图层等需要按重要性显示的要素
 * - 要素数量适中（100-5000个）的场景
 *
 * Performance characteristics:
 * - Uses QuadTree to accelerate collision detection, time complexity O(n log n)
 * - Moderate memory usage, maintaining QuadTree structure
 * - Suitable for real-time avoidance with moderate data volume
 *
 * 性能特点：
 * - 使用四叉树加速碰撞检测，时间复杂度 O(n log n)
 * - 内存占用中等，需要维护四叉树结构
 * - 适合中等数据量的实时避让
  * @category Core
 */
export declare class PriorityCollisionStrategy implements ICollisionStrategy {
    /**
     * Strategy unique identifier
     * 策略唯一标识
     */
    readonly name = "priority";
    /**
     * Whether strategy is enabled
     * 是否启用该策略
     */
    enabled: boolean;
    /**
     * Strategy weight (used in multi-strategy combination)
     * 策略权重（在多策略组合时使用）
     */
    weight: number;
    /**
     * Strategy description
     * 策略描述
     */
    description: string;
    /**
     * Execute avoidance detection
     * 执行避让检测
     *
     * @param features - Features array to check 需要检测的要素数组
     * @param context - Avoidance context (camera, renderer, viewport, etc.) 避让上下文（包含相机、渲染器、视口等信息）
     * @param previousResults - Results from previous strategies (for combination) 之前策略的执行结果（用于多策略组合）
     * @returns Avoidance results array, containing visibility and collision info for each feature 避让结果数组，包含每个要素的显示状态和碰撞信息
     *
     * @example
     * ```typescript
     * const results = await strategy.execute(features, context);
     * results.forEach(result => {
     *   feature.setCollisionVisibility(result.visible);
     * });
     * ```
     */
    execute(features: ICollidable[], context: ICollisionContext, previousResults?: Map<string, ICollisionResult>): Promise<ICollisionResult[]>;
}
