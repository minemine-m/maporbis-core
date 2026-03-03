import { IBoundingBox } from './types/CollisionTypes';
/**
 * QuadTree Collision Manager
 * 四叉树碰撞检测管理器
 *
 * @description
 * Uses QuadTree data structure to optimize collision detection performance for large numbers of bounding boxes.
 * Suitable for scenarios requiring efficient spatial queries like game development and graphics editors.
 * 使用四叉树数据结构优化大量边界框的碰撞检测性能
 * 适用于游戏开发、图形编辑器等需要高效空间查询的场景
  * @category Core
 */
export declare class QuadTreeManager {
    private _quadtree;
    private _viewport;
    /**
     * Constructor
     * 构造函数
     *
     * @param viewport Viewport dimensions defining the QuadTree boundaries
     *                 视口尺寸，定义四叉树的边界范围
     */
    constructor(viewport: {
        width: number;
        height: number;
    });
    /**
     * Update viewport dimensions
     * 更新视口尺寸
     *
     * @description
     * Rebuilds the QuadTree to adapt to new boundaries when viewport size changes.
     * 当视口大小改变时，重新构建四叉树以适应新的边界
     *
     * @param viewport New viewport dimensions
     *                 新的视口尺寸
     */
    updateViewport(viewport: {
        width: number;
        height: number;
    }): void;
    /**
     * Add bounding boxes to QuadTree
     * 添加边界框到四叉树
     *
     * @description
     * Only adds bounding boxes located within the viewport to optimize memory usage.
     * 只添加位于视口内的边界框，优化内存使用
     *
     * @param boxes Array of bounding boxes to add
     *              要添加的边界框数组
     */
    addBoxes(boxes: IBoundingBox[]): void;
    /**
     * Find all bounding boxes colliding with the target box
     * 查找与目标边界框发生碰撞的所有边界框
     *
     * @description
     * Uses QuadTree spatial partitioning to optimize search performance.
     * 使用四叉树的空间分割特性优化搜索性能
     *
     * @param targetBox Target bounding box
     *                  目标边界框
     * @returns Array of colliding bounding boxes
     *          与目标边界框发生碰撞的所有边界框数组
     */
    findCollisions(targetBox: IBoundingBox): IBoundingBox[];
    /**
     * Clear all data in QuadTree
     * 清空四叉树中的所有数据
     *
     * @description
     * Clears by rebuilding the QuadTree.
     * 通过重建四叉树实现清空操作
     */
    clear(): void;
    /**
     * Get all bounding boxes stored in QuadTree
     * 获取四叉树中存储的所有边界框
     *
     * @description
     * Used for debugging or serializing QuadTree state.
     * 用于调试或序列化四叉树状态
     *
     * @returns Array of all bounding boxes in QuadTree
     *          四叉树中所有边界框的数组
     */
    getAllBoxes(): IBoundingBox[];
    /**
     * Rebuild QuadTree
     * 重建四叉树
     *
     * @description
     * Reinitializes QuadTree structure based on current viewport dimensions.
     * Called when viewport changes or clearing data.
     * 根据当前视口尺寸重新初始化四叉树结构
     * 在视口改变或清空操作时调用
     */
    private _rebuildQuadTree;
    /**
     * Check if bounding box is within viewport
     * 检查边界框是否在视口内
     *
     * @description
     * Used to filter out objects outside viewport to optimize performance.
     * 用于过滤掉视口外的对象，优化性能
     *
     * @param box Bounding box to check
     *            要检查的边界框
     * @returns True if box is within viewport, false otherwise
     *          如果边界框在视口内返回true，否则返回false
     */
    private _isBoxInViewport;
    /**
     * Get expanded search bounds
     * 获取扩大的搜索边界范围
     *
     * @description
     * Expands search range to avoid missing edge objects, improving collision detection accuracy.
     * 扩大搜索范围以避免边界对象漏检，提高碰撞检测的准确性
     *
     * @param box Original bounding box
     *            原始边界框
     * @returns Expanded search bounds
     *          扩大后的搜索边界
     */
    private _getSearchBounds;
    /**
     * Check collision between search bounds and QuadTree node
     * 检查搜索边界与四叉树节点的碰撞
     *
     * @description
     * Uses AABB (Axis-Aligned Bounding Box) collision detection algorithm.
     * 使用AABB（轴对齐边界框）碰撞检测算法
     *
     * @param box Search bounding box
     *            搜索边界框
     * @param x0 Node bottom-left x
     *           节点左下角x坐标
     * @param y0 Node bottom-left y
     *           节点左下角y坐标
     * @param x1 Node top-right x
     *           节点右上角x坐标
     * @param y1 Node top-right y
     *           节点右上角y坐标
     * @returns True if intersecting, false otherwise
     *          如果相交返回true，否则返回false
     */
    private _checkNodeCollision;
    /**
     * 检查两个边界框之间的碰撞
     * 使用AABB碰撞检测算法
     * @param a 第一个边界框
     * @param b 第二个边界框
     * @returns 如果发生碰撞返回true，否则返回false
     */
    private _checkBoxCollision;
    /**
     * 从四叉树节点中提取边界框数据
     * 处理d3-quadtree节点的不同数据结构形式
     * @param node 四叉树节点
     * @returns 节点中包含的边界框数组
     */
    private _getNodeData;
    /**
   * 从四叉树中移除指定的边界框
   */
    removeBox(boxId: string): void;
}
