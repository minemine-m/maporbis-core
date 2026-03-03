/**
 * @module Layer
 */
/**
 * 导入线图层类
 * @description 用于管理和渲染线要素的图层类
 */
import { LineLayer, type LineLayerOptions } from "./LineLayer";

/**
 * 导入点图层类
 * @description 用于管理和渲染点要素的图层类
 */
import { PointLayer, type PointLayerOptions } from "./PointLayer";

/**
 * 导入面图层类
 * @description 用于管理和渲染面要素的图层类
 */
import { PolygonLayer, type PolygonLayerOptions } from "./PolygonLayer";

/**
 * 导入瓦片图层类
 * @description 用于管理和渲染地图瓦片的图层类
 */
import { WMTSTileLayer, type WMTSTileLayerOptions } from "./TileLayer/WMTSTileLayer";

/**
 * 导入栅格瓦片图层类
 * @description 用于管理和渲染栅格瓦片的图层类
 */
import { RasterTileLayer, type RasterTileLayerOptions } from "./TileLayer/RasterTileLayer";

/**
 * 导出所有图层类
 * @description 集中导出所有图层类，包括：
 * - LineLayer: 线要素图层
 * - PointLayer: 点要素图层
 * - PolygonLayer: 面要素图层
 * - WMTSTileLayer: WMTS瓦片图层
 * - RasterTileLayer: 栅格瓦片图层
 */
export {
  LineLayer,
  PointLayer,
  PolygonLayer,
  WMTSTileLayer,
  RasterTileLayer as TileLayer, // Export as TileLayer for convenience/backward compatibility
  RasterTileLayer
};
export type {
  LineLayerOptions,
  PointLayerOptions,
  PolygonLayerOptions,
  WMTSTileLayerOptions,
  RasterTileLayerOptions as TileLayerOptions,
  RasterTileLayerOptions
};

export * from './Layer';
export * from './OverlayLayer';
export * from './LayerContainer';
export * from './TileLayer/TileLayer';
export * from './TileLayer/renderer/VectorTileRenderLayer';
