import type { Feature } from '../feature/Feature';

/**
 * Base paint interface
 * 基础样式接口
 * @description Defines base properties shared by all paint types.
 * 定义所有样式类型共享的基础属性
 * @category Paint
 */
export type BasePaintType = {
    /**
     * Visibility
     * 是否可见
     * @default true
     */
    visible?: boolean;
    
    /**
     * Opacity (0-1)
     * 透明度 (0-1)
     * @default 1
     */
    opacity?: number;
    
    /**
     * Render Z-Index
     * 渲染层级
     * @description Higher value means rendered on top.
     * 数值越大渲染在越上层
     */
    zIndex?: number;
};

/**
 * Point feature paint configuration
 * 点要素样式配置
 * @extends BasePaintType
 * @category Paint
 */
export type PointPaintType = BasePaintType & {
    /**
     * Paint type identifier
     * 样式类型标识
     */
    type: 'point';
    
    /**
     * Point color
     * 点颜色
     * @description Supports CSS color strings or hex values.
     * 支持CSS颜色字符串或十六进制数值
     * @example '#ff0000' or 0xff0000
     */
    color?: string | number;
    
    /**
     * Point size
     * 点大小
     * @description Unit: pixels
     * 单位：像素
     * @default 10
     */
    size?: number;
    
    /**
     * Icon URL
     * 图标URL
     * @description Specified when an icon needs to be displayed.
     * 当需要显示图标时指定
     */
    icon?: string;
    
    // ...other point paint properties
};

/**
 * Line feature paint configuration
 * 线要素样式配置
 * @extends BasePaintType
 * @category Paint
 */
export type LinePaintType = BasePaintType & {
    /**
     * Paint type identifier
     * 样式类型标识
     */
    type: 'line';
    
    /**
     * Line color
     * 线颜色
     * @description Supports CSS color strings or hex values.
     * 支持CSS颜色字符串或十六进制数值
     * @example '#00ff00' or 0x00ff00
     */
    color?: string | number;
    
    /**
     * Line width
     * 线宽
     * @description Unit: pixels
     * 单位：像素
     * @default 2
     */
    width?: number;
    
    // ...other line paint properties
};

/**
 * Paint configuration union type
 * 样式配置联合类型
 * @description Contains all supported paint types.
 * 包含所有支持的样式类型
 * @category Paint
 */
export type SimplePaintConfig = PointPaintType | LinePaintType;

/**
 * Paint function type
 * 样式函数类型
 * @description Dynamically calculates paint based on feature and zoom level.
 * 根据要素和缩放级别动态计算样式
 * @template T Paint configuration type
 * @param feature Map feature
 * @param zoom Current zoom level (optional)
 * @returns Paint configuration object
 * @category Paint
 */
export type PaintFunction<T extends SimplePaintConfig> = (
    feature: Feature,
    zoom?: number
) => T;
