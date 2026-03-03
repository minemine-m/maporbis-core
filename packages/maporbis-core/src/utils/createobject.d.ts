import { Vector3, BufferGeometry, Points, PointsMaterial, Sprite, MeshBasicMaterial, Mesh, Shape, ShapeGeometry, InstancedMesh, CylinderGeometry, Object3D } from 'three';
import { Line2 } from 'three-stdlib';
import { Map as ProjectMap } from '../map';
import { CirclePaint, LinePaint, IconPaint, FillPaint, ExtrusionPaint, WaterPaint, CloudPaint, TextPaint, SymbolPaint, LightPaint, FlowTubePaint, ArrowPaint, FlowTexturePaint, WaterPaintUnion, HighlightWaterPaint } from '../style';
import { Cloud as vanillaCloud } from "@pmndrs/vanilla";
/**
 * 创建基础点要素
 * @param config 点样式配置
 * @param position 点位置
 * @returns 点要素对象
  * @category Utils
 */
export declare function _createBasicPoint(config: CirclePaint, position: Vector3): Points;
/**
 * 创建图标点要素
 * @param config 图标样式配置
 * @param position 点位置
 * @returns Promise<Sprite> 图标精灵对象
 */
export declare function _createIconPoint(config: IconPaint, position: Vector3): Promise<Sprite>;
/**
 * 创建基础线要素
 * @param config 线样式配置
 * @param positions 顶点坐标数组
 * @returns 线要素对象
  * @category Utils
 */
export declare function _createBasicLine(config: LinePaint, positions: Vector3[] | number[] | Float32Array): Line2;
/**
 * 创建流动管线
 * @param config 流动管线样式配置
 * @param positions 顶点坐标数组
 * @returns 管线网格
  * @category Utils
 */
export declare function _createFlowLine(config: FlowTubePaint, positions: Vector3[] | number[]): Mesh;
/**
 * 创建箭头流动线（平面带状）
 * @param config 箭头流动线样式配置
 * @param positions 顶点坐标数组
 * @returns 箭头网格
  * @category Utils
 */
export declare function _createArrowLine(config: ArrowPaint, positions: Vector3[] | number[]): Mesh;
/**
 * 创建纹理流动线（发光箭头线等）- 修复扭曲问题
 * @param config 纹理流动线样式配置
 * @param positions 顶点坐标数组
 * @returns 线状 Mesh
 */
export declare function _createFlowTextureLine(config: FlowTexturePaint, positions: Vector3[] | number[] | Float32Array): Promise<Mesh>;
/**
 * 创建基础多边形
 * @param config 多边形样式配置
 * @param positions 顶点坐标数组
 * @returns 多边形网格
  * @category Utils
 */
export declare function _createBasePolygon(config: FillPaint, polygons: Vector3[][][]): Mesh;
/**
 * 创建拉伸多边形
 * @param config 拉伸样式配置
 * @param flatPositions 平面坐标数组
 * @returns 拉伸多边形网格
  * @category Utils
 */
export declare function _createExtrudedPolygon(config: ExtrusionPaint, polygons: Vector3[][][]): Mesh;
/**
 * 创建水面效果
 * @param config 水面样式配置
 * @param map 地图实例
 * @param vertices 顶点坐标数组
 * @returns 水面网格
  * @category Utils
 */
export declare function _createWaterSurface(config: WaterPaint, map: ProjectMap, polygons: Vector3[][][]): Object3D;
/**
 * Create highlight water surface
 * 创建高亮水面
 * @param config Highlight water paint configuration
 * @param map Map instance
 * @param vertices Vertex coordinates
 * @returns Water mesh
 * @category Utils
 */
export declare function _createHighlightWater(config: HighlightWaterPaint, _map: ProjectMap, polygons: Vector3[][][]): Mesh;
/**
 * 创建多边形几何体
 * @param vertices 顶点坐标数组
 * @returns 几何体及相关数据
  * @category Utils
 */
export declare function _createPolygonGeometry(polygons: Vector3[][][]): {
    geometry: ShapeGeometry;
    center: {
        x: number;
        z: number;
    };
    avgY: number;
    shapes: Shape[];
};
/**
 * 创建基础水面
 * @param config 水面样式配置
 * @param vertices 顶点坐标数组
 * @returns Promise<Mesh> 水面网格
 */
export declare function _createBaseWaterSurface(config: WaterPaintUnion, polygons: Vector3[][][]): Promise<Mesh>;
/**
 * 创建云朵效果
 * @param config 云朵样式配置
 * @param position 云朵位置
 * @returns 云朵对象
  * @category Utils
 */
export declare function _createClouds(config: CloudPaint, position: Vector3): vanillaCloud;
/**
 * 创建文本精灵
 * @param config 文本样式配置
 * @param position 文本位置
 * @returns Promise<Sprite> 文本精灵
 */
export declare function _createTextSprite(config: TextPaint, position: Vector3): Promise<Sprite>;
/**
 * 创建固定大小的文本精灵
 * @param config 文本样式配置
 * @param position 文本位置
 * @param map 地图实例
 * @returns Promise<Sprite> 文本精灵
 */
export declare function _createFixedSizeTextSprite(config: TextPaint, position: Vector3, map: ProjectMap): Promise<Sprite>;
/**
 * 创建带有图标和文本的Sprite标签
 */
export declare function _createIconLabelSprite(options: SymbolPaint, position: Vector3): Promise<Sprite>;
export declare function createLight(config: LightPaint, geometries: any, map: ProjectMap): Promise<{
    points: Points<BufferGeometry<import("three").NormalBufferAttributes, import("three").BufferGeometryEventMap>, PointsMaterial, import("three").Object3DEventMap>;
    InstancedCol: InstancedMesh<CylinderGeometry, MeshBasicMaterial, import("three").InstancedMeshEventMap>;
}>;
