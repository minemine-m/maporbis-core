import {  ICollisionContext, ICollisionResult, CollisionReason,IBoundingBox } from './types/CollisionTypes';
import { ICollidable } from './interfaces/ICollidable';
import { ICollisionStrategy } from './interfaces/ICollisionStrategy'
import { QuadTreeManager } from './QuadTreeManager';

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
export class PriorityCollisionStrategy implements ICollisionStrategy {
    /** 
     * Strategy unique identifier 
     * 策略唯一标识 
     */
    readonly name = 'priority';
    
    /** 
     * Whether strategy is enabled 
     * 是否启用该策略 
     */
    enabled: boolean = true;
    
    /** 
     * Strategy weight (used in multi-strategy combination) 
     * 策略权重（在多策略组合时使用） 
     */
    weight: number = 1.0;
    
    /** 
     * Strategy description 
     * 策略描述 
     */
    description = 'Priority-based avoidance strategy, smaller value means higher priority 基于优先级的避让策略，数值越小优先级越高';
    
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
    async execute(
        features: ICollidable[], 
        context: ICollisionContext,
        previousResults?: Map<string, ICollisionResult>
    ): Promise<ICollisionResult[]> {
        const results: ICollisionResult[] = [];
        
        // Initialize QuadTree manager, use current viewport size as boundary
        // QuadTree divides screen space into grids to accelerate spatial queries
        // 初始化四叉树管理器，使用当前视口大小作为边界
        // 四叉树将屏幕空间划分为网格，加速空间查询
        const quadTreeManager = new QuadTreeManager(context.viewport);
        
        // ===== Step 1: Data Preparation Phase =====
        // ===== 第一步：数据准备阶段 =====
        
        // Collect all valid bounding boxes and feature map
        // 收集所有有效的包围盒和要素映射
        const boxes: IBoundingBox[] = [];
        const featureMap = new Map<string, ICollidable>();
        
        features.forEach(feature => {
            // Skip features not participating in avoidance
            // 跳过不参与避让的要素
            if (!feature.collidable) return;
            
            // Calculate feature's bounding box on current screen
            // Includes position, size, priority, etc.
            // 计算要素在当前屏幕上的包围盒
            // 包括位置、大小、优先级等信息
            const box = feature.getScreenBoundingBox(context.camera, context.renderer);
            if (box) {
                boxes.push(box);
                featureMap.set(feature._id, feature);
                
                // Check previous strategy results: if already marked hidden, skip current strategy processing
                // This implements "veto" mechanism in multi-strategy, avoiding low priority strategy overriding high priority strategy results
                // 检查之前策略的结果：如果已经被标记为隐藏，则跳过当前策略的处理
                // 这实现了多策略的"否决权"机制，避免低优先级策略覆盖高优先级策略的结果
                if (previousResults?.get(feature._id)?.visible === false) {
                    return;
                }
            }
        });
        
        // ===== Step 2: Sorting Phase =====
        // ===== 第二步：排序阶段 =====
        
        // Sort by priority ascending (smaller value means higher priority)
        // Sorting ensures high priority features are processed first and occupy spatial positions
        // 按优先级升序排序（数值越小优先级越高）
        // 排序确保高优先级要素先处理，先占用空间位置
        boxes.sort((a, b) => a.priority - b.priority);
        
        // ===== Step 3: Avoidance Detection Phase =====
        // ===== 第三步：避让检测阶段 =====
        
        // Process each feature in priority order
        // 按优先级顺序处理每个要素
        boxes.forEach(box => {
            // Use QuadTree to quickly query other features that might collide with current feature
            // Avoids brute-force check against all features, significantly improving performance
            // 使用四叉树快速查询可能与当前要素碰撞的其他要素
            // 避免与所有要素进行暴力检测，大幅提升性能
            const collisions = quadTreeManager.findCollisions(box);
            
            if (collisions.length === 0) {
                // === Case 1: No Collision ===
                // No other features at current position, safe to display
                // === 情况1：无碰撞 ===
                // 当前要素所在位置没有其他要素，可以安全显示
                
                // Add current feature to QuadTree, occupying spatial position
                // Subsequent features will avoid this position
                // 将当前要素加入四叉树，占据空间位置
                // 后续要素检测时会避开这个位置
                quadTreeManager.addBoxes([box]);
                
                // Record display result
                // 记录显示结果
                results.push({
                    featureId: box.featureId,
                    visible: true,
                    reason: CollisionReason.NO_COLLISION,  // No collision reason 无碰撞原因
                    collidedWith: [],                      // No collision object 无碰撞对象
                    timestamp: context.timestamp
                });
                
            } else {
                // === Case 2: Collision Detected ===
                // Need to decide which feature to display based on priority
                // === 情况2：有碰撞 ===
                // 需要根据优先级决定哪个要素显示
                
                // Check if there are higher priority colliding features
                // some() returns true immediately when first higher priority feature is found
                // 检查是否存在优先级更高的碰撞要素
                // some()方法在找到第一个更高优先级要素时立即返回true
                const hasHigherPriority = collisions.some(collision => 
                    collision.priority < box.priority
                );
                
                if (hasHigherPriority) {
                    // === Sub-case 2.1: Higher priority feature exists ===
                    // Current feature has lower priority, needs to be hidden
                    // === 子情况2.1：存在更高优先级要素 ===
                    // 当前要素优先级较低，需要隐藏
                    
                    results.push({
                        featureId: box.featureId,
                        visible: false,
                        reason: CollisionReason.PRIORITY_LOST,  // Priority lost reason 优先级不足原因
                        collidedWith: collisions.map(c => c.featureId),  // Record all colliding objects 记录所有碰撞对象
                        timestamp: context.timestamp
                    });
                    
                } else {
                    // === Sub-case 2.2: Current feature has highest priority ===
                    // Display current feature, hide all colliding lower priority features
                    // === 子情况2.2：当前要素优先级最高 ===
                    // 显示当前要素，隐藏所有碰撞的较低优先级要素
                    
                    // Add current feature to QuadTree, replacing original conflicting features
                    // 将当前要素加入四叉树，替换原来的冲突要素
                    quadTreeManager.addBoxes([box]);
                    
                    // Record display result for current feature
                    // 记录当前要素的显示结果
                    results.push({
                        featureId: box.featureId,
                        visible: true,
                        reason: CollisionReason.NO_COLLISION,
                        collidedWith: [],
                        timestamp: context.timestamp
                    });
                    
                    // Hide all colliding lower priority features
                    // These features might have been displayed before, now need to be replaced
                    // 隐藏所有被碰撞的较低优先级要素
                    // 这些要素之前可能已经显示，现在需要被替换
                    collisions.forEach(collision => {
                        results.push({
                            featureId: collision.featureId,
                            visible: false,
                            reason: CollisionReason.PRIORITY_LOST,
                            collidedWith: [box.featureId],  // Record replaced by which feature 记录被哪个要素替换
                            timestamp: context.timestamp
                        });
                    });
                }
            }
        });
        
        return results;
    }
}