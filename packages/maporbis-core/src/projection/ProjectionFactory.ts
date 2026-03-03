import { MapProjection, ProjectionType } from "./MapProjection";
import { WebMercatorProjection } from "./WebMercatorProjection";
import { WGS84Projection } from "./WGS84Projection";

/**
 * 投影工厂类
 * @class ProjectionFactory
 */
export class ProjectionFactory {
    /**
     * 创建投影实例
     * @param type 投影类型 ID ("3857" | "4326")
     * @param centralMeridian 中央经线，默认为 0
     * @returns MapProjection 实例
     * @throws Error 如果投影类型不支持
     */
    public static create(type: ProjectionType = "3857", centralMeridian: number = 0): MapProjection {
        switch (type) {
            case "3857":
                return new WebMercatorProjection(centralMeridian);
            case "4326":
                return new WGS84Projection(centralMeridian);
            default:
                throw new Error(`[ProjectionFactory] Unsupported projection type: ${type}`);
        }
    }
}
