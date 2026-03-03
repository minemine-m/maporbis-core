
/**
 * 几何体属性数据接口
 * @interface IGeometryAttribute
 */
export interface IGeometryAttribute {
    /** 属性值数组 (Float32Array) */
    value: Float32Array;
    /** 每个顶点的分量数 (例如: position=3, uv=2) */
    size: number;
}

/**
 * 几何体完整属性集合接口
 * @interface IGeometryAttributes
 */
export interface IGeometryAttributes {
    /** 顶点位置属性 */
    position: IGeometryAttribute;
    /** 纹理坐标属性 */
    texcoord: IGeometryAttribute;
    /** 法线属性 */
    normal: IGeometryAttribute;
}

/**
 * 几何体数据接口 (包含属性和索引)
 * @interface IGeometryData
 */
export interface IGeometryData {
    /** 顶点属性集合 */
    attributes: IGeometryAttributes;
    /** 顶点索引数组 */
    indices: Uint16Array | Uint32Array;
}
