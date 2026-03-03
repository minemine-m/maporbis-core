/**
 * Import version from package.json
 * 从package.json导入版本号
 */
import { version } from '../package.json';
/**
 * Print version information
 * 打印版本信息
 * @description Output styled version information in console 在控制台输出带样式的版本信息
 */
console.log('%c✨ MapOrbis V' + version + ' ', 'color:rgb(255, 255, 255); font-weight: bold; background: linear-gradient(90deg, #ffb6c1, #ff69b4); padding: 5px; border-radius: 5px;');
/**
 * Import DOM event handling module
 * 导入DOM事件处理模块
 * @description Add DOM event handling capabilities to map 为地图添加DOM事件处理能力
 */
import './map/Map.DomEvent';
import './map/handler/Map.FeatureEvents';
import "./feature/ext/Feature.InfoWindow";
import "./feature/ext/Feature.ToolTip";
import "./feature/ext/Feature.Edit";
/**
 * 导出sceneRenderer模块
 * @description 包含地图查看器相关功能
 */
export * from "./renderer";
/**
 * 导出Map模块
 * @description 包含核心地图功能
 */
export * from "./map";
export * from './map/tool/index';
/**
 * 导出图像瓦片源模块
 * @description 包含图像瓦片加载和处理功能
 */
export * from "./sources";
// export * from "./tilesystem";
export * from "./loaders";
export * from "./geometries";
export * from "./materials";
export * from "./core/tile";
/**
 * Export Layer module
 * 导出图层模块
 * @description Contains various layer types and layer management functionality 包含各种图层类型和图层管理功能
 */
export * from "./layer";
/**
 * Export Feature module
 * 导出要素模块
 * @description Contains geographic feature related functionality 包含地理要素相关功能
 */
export * from "./feature";
/**
 * Export Core module
 * 导出核心模块
 * @description Contains framework core functionality 包含框架核心功能
 */
export * from './core';
/**
 * Export Style module
 * 导出样式模块
 * @description Contains map style related functionality 包含地图样式相关功能
*/
export * from './style';
/**
 * Export UI module
 * 导出UI模块
 * @description Contains UI related functionality 包含UI相关功能
*/
export * from "./ui";
export { ProjectionFactory } from './projection';
/**
 * Export Utils module
 * 导出工具模块
 * @description Contains utility functions 包含工具函数
 */
export * from './utils';
