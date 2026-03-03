import { Quadtree } from 'd3-quadtree';
import { Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';

/**
 * 包围盒接口
 * 
 * @description
 * 表示要素在屏幕空间中的矩形区域，用于碰撞检测。
 * 避让系统基于这些包围盒进行重叠检测和冲突解决。
  * @category Core
 */
export interface IBoundingBox {
    /** 包围盒唯一标识，用于碰撞关系追踪 */
    id: string;
    /** 包围盒左上角在屏幕空间中的X坐标（像素） */
    x: number;
    /** 包围盒左上角在屏幕空间中的Y坐标（像素） */
    y: number;
    /** 包围盒宽度（像素） */
    width: number;
    /** 包围盒高度（像素） */
    height: number;
    /** 避让优先级，数值越高越重要，碰撞时优先显示 */
    priority: number;
    /** 对应的要素ID，关联到具体的要素对象 */
    featureId: string;
    /** 要素所属的图层ID，用于按图层管理避让策略 */
    layerId: string;
    /** 碰撞类型，影响避让算法和包围盒形状 */
    type: CollisionType;
    /** 扩展数据，可存储要素特定的避让相关信息 */
    data?: any;
}

/**
 * 碰撞检测结果接口
 * 
 * @description
 * 记录单个要素在避让检测后的最终状态和决策结果。
  * @category Core
 */
export interface ICollisionResult {
    /** 要素唯一标识 */
    featureId: string;
    /** 最终可见性决策结果 */
    visible: boolean;
    /** 可见性决策的原因说明 */
    reason: CollisionReason;
    /** 与该要素发生碰撞的其他要素ID列表 */
    collidedWith: string[];
    /** 结果生成的时间戳，用于动画同步 */
    timestamp: number;
}

/**
 * 碰撞检测上下文接口
 * 
 * @description
 * 包含单次避让检测所需的所有环境信息，确保检测的一致性。
  * @category Core
 */
export interface ICollisionContext {
    /** 相机对象，用于坐标投影和视锥体计算 */
    camera: Camera;
    /** 渲染器对象，提供画布尺寸和渲染状态 */
    renderer: WebGLRenderer | WebGPURenderer;
    /** 视口尺寸信息，用于屏幕坐标转换 */
    viewport: { width: number; height: number };
    /** 当前地图缩放级别，用于层级过滤 */
    zoomLevel: number;
    /** 检测时间戳，用于性能分析和状态同步 */
    timestamp: number;
    /** 帧编号，用于追踪检测频率和优化性能 */
    frameNumber: number;
}

/**
 * 四叉树接口扩展
 * 
 * @description
 * 基于d3-quadtree的扩展，用于高效的空间索引和碰撞检测。
 * 将屏幕空间划分为四叉树结构，快速查找可能发生碰撞的要素。
  * @category Core
 */
export interface IQuadTree extends Quadtree<IBoundingBox> {
    /** 四叉树的空间边界范围 [[minX, minY], [maxX, maxY]] */
    _bounds?: [[number, number], [number, number]];
}

/**
 * 碰撞类型枚举
 * 
 * @description
 * 定义不同类型的要素在避让系统中的处理方式。
 * 不同类型的要素使用不同的包围盒计算策略。
  * @category Core
 */
export enum CollisionType {
    /** 点要素 - 使用圆形或小方形包围盒 */
    POINT = 'point',
    /** 线要素的顶点 - 沿线分布的多个点 */
    LINE_VERTEX = 'line_vertex',
    /** 面要素的中心点 - 通常用于面要素的标签定位 */
    POLYGON_CENTER = 'polygon_center',
    /** 文字标签 - 考虑文字内容和字体大小的矩形区域 */
    LABEL = 'label',
    /** 图标要素 - 固定尺寸的方形或圆形区域 */
    ICON = 'icon',
    /** 聚合要素 - 代表多个要素的聚合点 */
    CLUSTER = 'cluster'
}

/**
 * 碰撞原因枚举
 * 
 * @description
 * 记录要素可见性变化的详细原因，用于调试和不同原因的特殊处理。
  * @category Core
 */
export enum CollisionReason {
    /** 无碰撞 - 要素正常显示 */
    NO_COLLISION = 'no_collision',
    /** 优先级失败 - 与其他要素碰撞且优先级较低 */
    PRIORITY_LOST = 'priority_lost',
    /** 超出视口 - 要素位于屏幕可见区域之外 */
    OUT_OF_VIEWPORT = 'out_of_viewport',
    /** 层级过滤 - 当前缩放级别不满足显示条件 */
    ZOOM_FILTERED = 'zoom_filtered',
    /** 手动隐藏 - 用户主动隐藏该要素 */
    MANUAL_HIDDEN = 'manual_hidden',
    /** 组碰撞 - 与同一组内的其他要素发生碰撞 */
    GROUP_COLLISION = 'group_collision'
}

/**
 * 避让系统配置接口
 * 
 * @description
 * 控制避让系统整体行为的配置参数，支持运行时调整。
  * @category Core
 */
export interface ICollisionConfig {
    /** 是否启用避让系统，关闭后所有要素都会显示 */
    enabled: boolean;
    /** 包围盒外边距（像素），增加检测区域避免紧贴 */
    padding: number;
    /** 避让检测更新间隔（毫秒），控制检测频率平衡性能 */
    updateInterval: number;
    /** 显示/隐藏动画的持续时间（毫秒） */
    animationDuration: number;
    /** 每帧最多处理的要素数量，防止单帧卡顿 */
    maxFeaturesPerFrame: number;
    /** 视口外边距（像素），提前检测即将进入视口的要素 */
    viewportMargin: number;
    /** 避让策略配置 */
    strategies: {
        /** 是否启用优先级策略 - 高优先级要素优先显示 */
        priority: boolean;
        /** 是否启用分组策略 - 同组要素协同避让 */
        grouping: boolean;
        /** 是否启用邻近策略 - 考虑要素间的相对位置 */
        proximity: boolean;
    };
}