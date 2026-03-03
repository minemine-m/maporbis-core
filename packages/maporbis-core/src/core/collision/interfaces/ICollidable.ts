import { Camera, WebGLRenderer } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { CollisionType, IBoundingBox, CollisionReason } from '../types/CollisionTypes';

/**
 * 可避让要素接口
 * 
 * @description
 * 定义了要素参与避让检测必须实现的方法和属性。
 * 避让系统用于解决地图上要素重叠显示的问题，确保重要信息清晰可见。
  * @category Core
 */
export interface ICollidable {
    /** 要素唯一标识，用于避让系统的要素识别和碰撞关系追踪 */
    readonly _id: string;
    
    /** 
     * 是否参与避让检测
     * @returns true-参与避让检测，false-忽略避让检测（始终显示）
     */
    readonly collidable: boolean;
    
    /** 
     * 碰撞类型，决定避让策略和包围盒计算方式
     * @example CollisionType.POINT - 点要素，使用圆形或方形包围盒
     * @example CollisionType.LABEL - 文字标签，考虑文字尺寸
     */
    readonly collisionType: CollisionType;
    
    /**
     * 获取避让优先级
     * @returns 优先级数值（0-100），数值越高显示优先级越高
     * @description 当多个要素发生碰撞时，优先级高的要素会显示，优先级低的会被隐藏
     */
    getCollisionPriority(): number;
    
    /**
     * 获取屏幕空间包围盒
     * @param camera 相机对象，用于坐标投影计算
     * @param renderer 渲染器，提供视口尺寸信息
     * @returns 屏幕空间的包围盒信息，如果要素不可见或不在视口内返回null
     * @description 将3D世界坐标转换为2D屏幕坐标，计算要素在屏幕上的占用区域
     */
    getScreenBoundingBox(camera: Camera, renderer: WebGLRenderer | WebGPURenderer): IBoundingBox | null;
    
    /**
     * 设置碰撞可见性
     * @param visible 是否可见
     * @param immediately 是否立即生效（true-无过渡动画，false-淡入淡出动画）
     * @param reason 可见性变化的原因（碰撞、手动操作等）
     * @description 避让系统根据碰撞检测结果调用此方法来控制要素显示/隐藏
     */
    setCollisionVisibility(visible: boolean, reason?: CollisionReason): void;
    
    /**
     * 获取当前碰撞可见性状态
     * @returns 当前是否因避让原因而可见
     * @description 注意：这与要素的visible属性可能不同，仅反映避让系统的可见性决策
     */
    getCollisionVisibility(): boolean;
    
    /**
     * 碰撞状态变化回调（可选）
     * @param state 新的碰撞状态
     * @description 当要素的避让状态发生变化时触发，用于外部监听状态变化
     */
    onCollisionStateChange?(state: ICollisionState): void;
    
    /**
     * 获取碰撞相关数据（可选）
     * @returns 避让系统需要的扩展数据
     * @description 提供要素的额外信息，用于更智能的避让决策
     */
    getCollisionData?(): any;
}

/**
 * 碰撞状态接口
 * 
 * @description
 * 记录要素在避让系统中的当前状态信息，用于状态追踪和动画过渡。
  * @category Core
 */
export interface ICollisionState {
    /** 当前是否可见（避让系统的可见性决策结果） */
    visible: boolean;
    
    /** 可见性变化的原因，用于诊断和不同原因的不同处理策略 */
    reason: CollisionReason;
    
    /** 与当前要素发生碰撞的其他要素ID列表，用于分析碰撞关系 */
    collidedWith: string[];
    
    /** 状态更新时间戳，用于动画计时和状态新鲜度判断 */
    timestamp: number;
}