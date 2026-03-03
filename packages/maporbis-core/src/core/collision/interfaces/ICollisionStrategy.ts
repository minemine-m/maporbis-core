import { ICollidable } from './ICollidable';
import { ICollisionContext, ICollisionResult } from '../types/CollisionTypes';

/**
 * @category Core
 */
export interface ICollisionStrategy {
    /** 策略唯一标识 */
    readonly name: string;
    
    /** 策略描述 */
    readonly description: string;
    
    /** 是否启用 */
    enabled: boolean;
    
    /** 策略权重（用于多策略组合） */
    weight: number;
    
    /** 
     * 执行避让检测
     * @param features 要检测的要素数组
     * @param context 避让上下文（相机、渲染器等）
     * @param previousResults 之前策略的结果（用于多策略组合）
     */
    execute(
        features: ICollidable[], 
        context: ICollisionContext,
        previousResults?: Map<string, ICollisionResult>
    ): Promise<ICollisionResult[]> | ICollisionResult[];
    
    /** 策略初始化（可选） */
    initialize?(config: any): void;
    
    /** 策略销毁（可选） */
    destroy?(): void;
}