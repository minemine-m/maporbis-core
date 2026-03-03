import { IQuadTree, IBoundingBox } from './types/CollisionTypes';
import { quadtree } from 'd3-quadtree';

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
export class QuadTreeManager {
    //@ts-ignore
    private _quadtree: IQuadTree;
    private _viewport: { width: number; height: number };

    /**
     * Constructor
     * 构造函数
     * 
     * @param viewport Viewport dimensions defining the QuadTree boundaries
     *                 视口尺寸，定义四叉树的边界范围
     */
    constructor(viewport: { width: number; height: number }) {
        this._viewport = viewport;
        this._rebuildQuadTree();
    }

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
    updateViewport(viewport: { width: number; height: number }): void {
        if (viewport.width !== this._viewport.width || viewport.height !== this._viewport.height) {
            this._viewport = viewport;
            this._rebuildQuadTree();
        }
    }

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
    addBoxes(boxes: IBoundingBox[]): void {
        boxes.forEach(box => {
            if (this._isBoxInViewport(box)) {
                this._quadtree.add(box);
            }
        });
    }

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
    findCollisions(targetBox: IBoundingBox): IBoundingBox[] {
        const collisions: IBoundingBox[] = [];
        // Get expanded search bounds to avoid edge cases
        // 获取扩大的搜索范围，避免边界情况漏检
        const searchBounds = this._getSearchBounds(targetBox);

        /**
         * Visit QuadTree nodes
         * 遍历四叉树节点
         * 
         * @description
         * The visit method performs depth-first traversal of all relevant QuadTree nodes.
         * visit方法会深度优先遍历四叉树的所有相关节点
         * 
         * @param node Current node
         *             当前节点
         * @param x0 Node bottom-left x
         *           节点左下角x坐标
         * @param y0 Node bottom-left y
         *           节点左下角y坐标
         * @param x1 Node top-right x
         *           节点右上角x坐标
         * @param y1 Node top-right y
         *           节点右上角y坐标
         */
        this._quadtree.visit((node, x0, y0, x1, y1) => {
            // Check if search bounds intersect with current QuadTree node
            // 检查搜索范围是否与当前四叉树节点相交
            if (!this._checkNodeCollision(searchBounds, x0, y0, x1, y1)) {
                return; // No intersection, skip this node and its children 不相交，跳过该节点及其所有子节点
            }

            if (node.length) {
                // Internal node (non-leaf), contains children
                // Return false to continue traversing children
                // 内部节点（非叶子节点），包含子节点
                // 返回false表示继续遍历该节点的子节点
                return false;
            }

            // Leaf node, contains actual bounding box data
            // 叶子节点，包含实际的边界框数据
            const nodeData = this._getNodeData(node);
            
            // Check collisions between all boxes in leaf node and target box
            // 检查叶子节点中的所有边界框与目标边界框的碰撞
            nodeData.forEach(existingBox => {
                // Exclude self-collision check
                // 排除自碰撞检查，确保不与自己比较
                if (existingBox.id !== targetBox.id &&
                    this._checkBoxCollision(targetBox, existingBox)) {
                    collisions.push(existingBox);
                }
            });

            // Return false to continue traversing other relevant nodes
            // 返回false继续遍历其他相关节点
            return false;
        });

        return collisions;
    }

    /**
     * Clear all data in QuadTree
     * 清空四叉树中的所有数据
     * 
     * @description
     * Clears by rebuilding the QuadTree.
     * 通过重建四叉树实现清空操作
     */
    clear(): void {
        this._rebuildQuadTree();
    }

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
    getAllBoxes(): IBoundingBox[] {
        const boxes: IBoundingBox[] = [];
        this._quadtree.visit((node) => {
            // Only process leaf nodes (containing actual data)
            // 只处理叶子节点（包含实际数据）
            if (!node.length) {
                const nodeData = this._getNodeData(node);
                boxes.push(...nodeData);
            }
            return false; // Continue traversing all nodes 继续遍历所有节点
        });
        return boxes;
    }

    // ============ Private Methods 私有方法 ============

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
    private _rebuildQuadTree(): void {
        this._quadtree = quadtree<IBoundingBox>()
            .x(d => d.x)           // Set x accessor: get x from box object 设置x坐标访问器：从边界框对象获取x坐标
            .y(d => d.y)           // Set y accessor: get y from box object 设置y坐标访问器：从边界框对象获取y坐标
            .extent([[0, 0], [this._viewport.width, this._viewport.height]]); // Set QuadTree bounds 设置四叉树边界范围
    }

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
    private _isBoxInViewport(box: IBoundingBox): boolean {
        // Calculate half width and height (box coordinates are center points)
        // 计算边界框的半宽半高（边界框以中心点为坐标）
        const halfWidth = box.width / 2;
        const halfHeight = box.height / 2;

        // Check intersection with viewport
        // 检查边界框是否与视口相交
        return box.x + halfWidth >= 0 &&                    // Right edge within right of viewport 右边界在视口右侧以内
               box.x - halfWidth <= this._viewport.width &&  // Left edge within left of viewport 左边界在视口左侧以内
               box.y + halfHeight >= 0 &&                   // Bottom edge within bottom of viewport 下边界在视口底部以内
               box.y - halfHeight <= this._viewport.height;  // Top edge within top of viewport 上边界在视口顶部以内
    }

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
    private _getSearchBounds(box: IBoundingBox): { x: number; y: number; width: number; height: number } {
        const expand = 2; // Expansion factor, adjust as needed 扩大倍数，根据实际需求调整
        return {
            x: box.x,
            y: box.y,
            width: box.width * expand,   // Width expanded 宽度扩大
            height: box.height * expand  // Height expanded 高度扩大
        };
    }

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
    private _checkNodeCollision(box: { x: number; y: number; width: number; height: number }, 
                               x0: number, y0: number, x1: number, y1: number): boolean {
        // Calculate node center and dimensions
        // 计算四叉树节点的中心点和尺寸
        const nodeCenterX = (x0 + x1) / 2;
        const nodeCenterY = (y0 + y1) / 2;
        const nodeWidth = x1 - x0;
        const nodeHeight = y1 - y0;

        /**
         * AABB Collision Detection Formula:
         * AABB碰撞检测公式：
         * Condition for non-overlapping rectangles on x-axis:
         * 两个矩形在x轴方向上的投影不重叠的条件：
         * |centerX1 - centerX2| > (width1 + width2) / 2
         * So overlap condition is:
         * 因此重叠的条件是：
         * |centerX1 - centerX2| * 2 < (width1 + width2)
         * Same applies to y-axis
         * 同理适用于y轴方向
         */
        return Math.abs(box.x - nodeCenterX) * 2 < (box.width + nodeWidth) &&
               Math.abs(box.y - nodeCenterY) * 2 < (box.height + nodeHeight);
    }

    /**
     * 检查两个边界框之间的碰撞
     * 使用AABB碰撞检测算法
     * @param a 第一个边界框
     * @param b 第二个边界框
     * @returns 如果发生碰撞返回true，否则返回false
     */
    private _checkBoxCollision(a: IBoundingBox, b: IBoundingBox): boolean {
        /**
         * 优化后的AABB碰撞检测：
         * 比较两个矩形中心点在x轴和y轴方向上的距离
         * 与两个矩形半宽之和、半高之和的关系
         */
        return Math.abs(a.x - b.x) * 2 < (a.width + b.width) &&   // x轴方向碰撞检测
               Math.abs(a.y - b.y) * 2 < (a.height + b.height);   // y轴方向碰撞检测
    }

    /**
     * 从四叉树节点中提取边界框数据
     * 处理d3-quadtree节点的不同数据结构形式
     * @param node 四叉树节点
     * @returns 节点中包含的边界框数组
     */
    private _getNodeData(node: any): IBoundingBox[] {
        if (!node) return [];                    // 空节点返回空数组
        if (Array.isArray(node.data)) return node.data;  // 节点包含数据数组
        if (node.data) return [node.data];       // 节点包含单个数据对象
        return [];                               // 默认返回空数组
    }

      /**
     * 从四叉树中移除指定的边界框
     */
    removeBox(boxId: string): void {
        const allBoxes = this.getAllBoxes();
        const remainingBoxes = allBoxes.filter(box => box.id !== boxId);
        
        // 重建四叉树（保留剩余的所有框）
        this.clear();
        if (remainingBoxes.length > 0) {
            this.addBoxes(remainingBoxes);
        }
    }

    
}