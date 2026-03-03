/**
 * 投影模块入口
 * @module Projection
 */

export * from "./MapProjection";
export * from "./AbstractProjection";
export * from "./WebMercatorProjection";
export * from "./WGS84Projection";
export * from "./ProjectionFactory";

// 为了保持向后兼容性（可选，但推荐在重构时提供别名，或者我们稍后去修改引用）
// 这里我先不提供别名，而是直接修改引用，这样更彻底。
