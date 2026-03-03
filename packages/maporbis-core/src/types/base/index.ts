/**
 * Geographic coordinate type.
 * 基础坐标类型
 * @description Represents a point in 2D or 3D space. 表示二维或三维空间中的坐标点
 * 
 * @typedef {Array} LngLatLike
 * @property {number} 0 - Longitude or X coordinate. X坐标（经度或水平位置）
 * @property {number} 1 - Latitude or Y coordinate. Y坐标（纬度或垂直位置）
 * @property {number} [2] - Optional altitude or Z coordinate. 可选Z坐标（高度或深度）
 * 
 * @example
 * // 2D coordinate
 * const coord2D: LngLatLike = [116.404, 39.915];
 * 
 * @example
 * // 3D coordinate
 * const coord3D: LngLatLike = [116.404, 39.915, 500];
 * @category Types
 */
export type LngLatLike = [number, number] | [number, number, number];

/**
 * Named anchor position type.
 * 命名锚点位置类型
 * @description Defines named positions for anchoring UI elements and markers
 * 
 * Anchor positioning system:
 * - 'top-left': [0, 1] - Top-left corner  图标左上角
 * - 'top': [0.5, 1] - Top center 图标正上方中心
 * - 'top-right': [1, 1] - Top-right corner 图标右上角
 * - 'left': [0, 0.5] - Middle left 图标正左侧中心
 * - 'center': [0.5, 0.5] - Center 图标中心
 * - 'right': [1, 0.5] - Middle right 图标正右侧中心
 * - 'bottom-left': [0, 0] - Bottom-left corner 图标左下角
 * - 'bottom': [0.5, 0] - Bottom center 图标正下方中心
 * - 'bottom-right': [1, 0] - Bottom-right corner 图标右下角
 * 
 * @category Types
 */
export type AnchorPosition =
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right';

/**
 * Anchor type: supports both named positions and numeric array format.
 * 锚点类型：支持命名位置和数值数组格式
 * @description Can be either a named position or [x, y] coordinates where x and y are in range [0, 1]
 * 
 * @example
 * // Named anchor
 * const anchor1: Anchor = 'top-right';
 * 
 * @example
 * // Numeric anchor
 * const anchor2: Anchor = [0.5, 0.5]; // center
 * 
 * @category Types
 */
export type Anchor = AnchorPosition | [number, number];

/**
 * Convert named anchor position to numeric [x, y] array.
 * 将命名锚点位置转换为数值 [x, y] 数组
 * @param anchor - Named anchor position or numeric array
 * @returns Numeric [x, y] array where x and y are in range [0, 1]
 * 
 * @example
 * normalizeAnchor('top-right') // returns [1, 1]
 * normalizeAnchor([0.3, 0.7]) // returns [0.3, 0.7]
 * normalizeAnchor('center') // returns [0.5, 0.5]
 * 
 * @category Types
 */
export function normalizeAnchor(anchor?: Anchor): [number, number] {
    if (!anchor) return [0.5, 0.5]; // default center
    
    if (Array.isArray(anchor)) {
        return anchor as [number, number];
    }
    
    // Convert named position to numeric coordinates
    switch (anchor) {
        case 'top-left':
            return [0, 1];
        case 'top':
            return [0.5, 1];
        case 'top-right':
            return [1, 1];
        case 'left':
            return [0, 0.5];
        case 'center':
            return [0.5, 0.5];
        case 'right':
            return [1, 0.5];
        case 'bottom-left':
            return [0, 0];
        case 'bottom':
            return [0.5, 0];
        case 'bottom-right':
            return [1, 0];
        default:
            return [0.5, 0.5];
    }
}