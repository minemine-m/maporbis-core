import { BufferAttribute, PlaneGeometry } from "three";
import { GeometrySkirtUtils } from "./GeometrySkirtUtils";
import { GeometryHelper } from "./GeometryHelper";
/**
 * 地图瓦片几何体
 * @class MapTileGeometry
 * @extends PlaneGeometry
 * @description 专用于地图瓦片的几何体，支持设置地形数据和自动生成裙边。
 */
export class MapTileGeometry extends PlaneGeometry {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "MapTileGeometry"
        });
    }
    /**
     * 设置地形数据
     * @param data 几何体数据 (IGeometryData) 或 DEM 高度图 (Float32Array)
     * @param skirtHeight 裙边高度 (米), 默认 1000
     * @returns this
     */
    setTerrainData(data, skirtHeight = 1000) {
        let geoData;
        // 1. 规范化输入数据
        if (data instanceof Float32Array) {
            geoData = GeometryHelper.fromDEM(data);
        }
        else {
            geoData = data;
        }
        // 2. 添加裙边 (Skirt) 以防止接缝
        if (skirtHeight > 0) {
            geoData = GeometrySkirtUtils.addSkirt(geoData, skirtHeight);
        }
        // 3. 更新 Three.js 几何体属性
        this.updateThreeJSAttributes(geoData);
        // 4. 更新边界包围盒 (用于视锥体裁剪)
        this.computeBoundingBox();
        this.computeBoundingSphere();
        return this;
    }
    /**
     * 更新 Three.js BufferAttributes
     * @param geoData
     */
    updateThreeJSAttributes(geoData) {
        const { attributes, indices } = geoData;
        // 设置索引
        this.setIndex(new BufferAttribute(indices, 1));
        // 设置属性
        this.setAttribute("position", new BufferAttribute(attributes.position.value, attributes.position.size));
        this.setAttribute("uv", new BufferAttribute(attributes.texcoord.value, attributes.texcoord.size));
        this.setAttribute("normal", new BufferAttribute(attributes.normal.value, attributes.normal.size));
    }
}
