import { MapProjection, ProjectionType } from "./MapProjection";
/**
 * 投影工厂类
 * @class ProjectionFactory
 */
export declare class ProjectionFactory {
    /**
     * 创建投影实例
     * @param type 投影类型 ID ("3857" | "4326")
     * @param centralMeridian 中央经线，默认为 0
     * @returns MapProjection 实例
     * @throws Error 如果投影类型不支持
     */
    static create(type?: ProjectionType, centralMeridian?: number): MapProjection;
}
