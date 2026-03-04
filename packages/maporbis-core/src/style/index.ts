/**
 * @module Paint
 */
import {
    Color, Object3D, Points, PointsMaterial,
    Sprite, TextureLoader,
    Texture, Group, Material, Vector2,
    Vector3, LoadingManager, Matrix4,
} from 'three';
import { Line2 } from 'three-stdlib';
import { _createBasicPoint, _createIconPoint, _createBasicLine } from '../utils/createobject';
import { Feature } from '../feature/Feature';
import type { Anchor } from '../types';

/**
 * Base paint interface.
 * 基础样式接口
 * @category Paint
 */
export interface BasePaint {
    /** 是否可见 */
    visible?: boolean;
    /** 透明度 (0-1) */
    opacity?: number;
    /** 渲染层级 */
    zIndex?: number;
    /** 碰撞检测优先级 */
    collisionPriority?: number;
    /** 可选：深度偏移等级（整数） */
    depthOffset?: number;       // 0 默认, 正数往镜头方向"浮"一点
    depthTest?: boolean;       // 默认 true
    depthWrite?: boolean;      // 默认 true
    transparent?: boolean;    // 默认 true
    alphaTest?: number;       // 默认 0.05
    /** 发光配置（可选，配合全局 bloom 后处理） */
    bloom?: boolean | {
        /** 是否启用发光（默认 true） */
        enabled?: boolean;
        /** 发光强度（默认 1.0） */
        intensity?: number;
        /** 发光颜色（默认 '#ffffff'） */
        color?: string;
    };
}

/**
 * Circle paint configuration.
 * 基础点样式配置
 * @category Paint
 */
export interface CirclePaint extends BasePaint {
    type: 'circle';
    /** 点颜色 */
    color?: string | number | Color;
    /** 点大小 */
    size: number;
    /** 是否发光 */
    glow?: boolean;
    /** 是否随距离衰减 */
    sizeAttenuation?: boolean;
}

/**
 * Icon paint configuration.
 * 图标点样式配置
 * @category Paint
 */
export interface IconPaint extends BasePaint {
    type: 'icon';
    /** 点颜色 */
    color?: string | number | Color;
    /** 图标URL */
    url: string;
    /** 图标尺寸 [宽, 高] */
    size: number | [number, number]; // 像素值或单个数值
    /** 旋转角度 */
    rotation?: number;
    /** 
     * Anchor position: named position or [x, y] coordinates.
     * 锚点位置：命名位置或 [x, y] 坐标
     * @example 'center' | 'top-right' | [0.5, 0.5]
     */
    anchor?: Anchor;
    /** 是否随距离衰减 */
    sizeAttenuation?: boolean;
    sizeUnit?: 'pixels' | 'meters'; //单位标识
}

/**
 * Text paint configuration.
 * 标签样式配置
 * @category Paint
 */
export interface TextPaint extends BasePaint {
    type: 'text' | 'text-fixed';
    /** 文本内容 */
    text: string;
    /** 字体大小像素Dpi，默认不传，内部会自动处理 */
    fontSizeDpi?: number;
    /** 字体家族 */
    fontFamily?: string;
    /** 字体粗细 */
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
    /** 字体样式 */
    fontStyle?: 'normal' | 'italic' | 'oblique';

    // 文字样式
    /** 文字颜色 */
    textColor?: string;
    /** 描边颜色 */
    strokeColor?: string;
    /** 描边宽度 */
    strokeWidth?: number;

    // 背景控制
    /** 是否显示背景 */
    showBackground?: boolean;
    /** 背景样式 */
    bgStyle?: 1 | 2;
    /** 背景颜色 */
    bgColor?: string;
    /** 背景透明度 */
    bgOpacity?: number;

    // 阴影效果
    /** 阴影颜色 */
    shadowColor?: string;
    /** 阴影模糊度 */
    shadowBlur?: number;
    /** 阴影X偏移 */
    shadowOffsetX?: number;
    /** 阴影Y偏移 */
    shadowOffsetY?: number;

    // 圆角矩形配置
    /** 圆角半径 */
    roundRectRadius?: number;

    // 气泡样式配置
    /** 气泡指针高度 */
    bubblePointerHeight?: number;
    /** 气泡指针宽度 */
    bubblePointerWidth?: number;
    /** 气泡边框颜色 */
    bubbleBorderColor?: string;
    /** 气泡边框宽度 */
    bubbleBorderWidth?: number;

    // 尺寸控制
    /** 固定显示大小（与 screenSpaceSize 含义一致，推荐使用 screenSpaceSize） */
    fixedSize?: number;
    /** 屏幕空间大小，语义为在屏幕上的目标高度（CSS 像素） */
    screenSpaceSize?: number;

    /** 文本偏移 */
    textOffset?: { x: number; y: number };

    /** 
     * Anchor position: named position or [x, y] coordinates.
     * 整体锚点：命名位置或 [x, y] 坐标
     * @example 'center' | 'top-right' | [0.5, 0.5]
     */
    anchor?: Anchor;
}

/**
 * Symbol paint configuration.
 * 图标标签样式配置
 * @category Paint
 */
export interface SymbolPaint extends BasePaint {
    type: 'symbol';
    /** 文本内容 */
    text: string;

    // 图标相关
    /** 图标URL */
    url?: string;
    /** 图标大小 */
    iconSize?: number | [number, number];
    size?: number | [number, number];
    /** 图标缩放 */
    iconScale?: number;

    // 文本样式
    /** 字体大小 */
    fontSize?: number;
    /** 字体家族 */
    fontFamily?: string;
    fontWeight?: number;
    /** 文字颜色 */
    textColor?: string;
    /** 描边颜色 */
    strokeColor?: string;
    /** 描边宽度 */
    strokeWidth?: number;
    /** 是否渲染背景 */
    renderbg?: boolean;

    // 背景和布局
    /** 背景颜色 */
    bgColor?: string;
    /** 背景透明度 */
    bgOpacity?: number;
    /** 内边距 */
    padding?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };

    // 整体缩放
    /** 画布缩放 */
    canvasScale?: number;

    /** 文本偏移 */
    textOffset?: { x: number; y: number };

    /** 
     * Anchor position: named position or [x, y] coordinates.
     * 整体锚点：命名位置或 [x, y] 坐标，等同于 Sprite.center / IconPointStyle.anchor
     * @example 'center' | 'top-right' | [0.5, 0.5]
     */
    anchor?: Anchor;

}

/**
 * Fill paint configuration.
 * 基础多边形样式配置
 * @category Paint
 */
export interface FillPaint extends BasePaint {
    type: 'fill';
    /** 填充颜色 */
    color?: string | number | Color;
    /** 透明度 */
    opacity?: number;
    /** 是否显示线框 */
    wireframe?: boolean;
    /** 线框颜色 */
    wireframeColor?: string | number | Color;
    /** 线框宽度 */
    wireframeWidth?: number;
    /** 边框颜色 */
    borderColor?: string | number | Color;
    /** 边框宽度 */
    borderWidth?: number;
    /** 边框虚线数组 */
    borderdashArray?: number[];
    /** 渲染面 */
    side?: 'front' | 'back' | 'double';
    /** 是否使用顶点颜色 */
    vertexColors?: boolean;
    /** 是否使用平面着色 */
    flatShading?: boolean;
}

/**
 * Extrusion paint configuration.
 * 拉伸多边形样式配置
 * @category Paint
 */
export interface ExtrusionPaint extends BasePaint {
    type: 'extrusion';
    /** 填充颜色 */
    color?: number | string;
    /** 透明度 */
    opacity?: number;
    /** 是否显示线框 */
    wireframe?: boolean;
    /** 渲染面 */
    side?: 'front' | 'back' | 'double';
    /** 拉伸配置 */
    extrude?: {
        /** 拉伸高度 */
        height: number;
        /** 是否启用斜角 */
        bevelEnabled?: boolean;
    };
}

/**
 * Water paint configuration.
 * 水面样式配置
 * @category Paint
 */
export interface WaterPaint extends BasePaint {
    type: 'water'
    /** 水面颜色 */
    color?: number | string;
    /** 透明度 */
    opacity?: number;
    /** 阳光方向 */
    sunDirection?: Vector3;
    /** 阳光颜色 */
    sunColor?: number | string;
    /** 波纹强度 */
    distortionScale?: number;
    /** 波纹大小 */
    size?: number;
    /** 法线贴图URL */
    normalMap: string;
    /** 是否受雾影响 */
    fog?: boolean;
}

/**
 * Simple water paint configuration.
 * 基础水面样式配置
 * @category Paint
 */
export interface SimpleWaterPaint extends BasePaint {
    type: 'water-simple'
    /** 水面颜色 */
    color?: number | string;
    /** 透明度 */
    opacity?: number;
    /** 阳光方向 */
    sunDirection?: Vector3;
    /** 阳光颜色 */
    sunColor?: number | string;
    /** 波纹强度 */
    distortionScale?: number;
    /** 波纹大小 */
    size?: number;
    /** 法线贴图URL */
    normalMap: string;
    /** 是否受雾影响 */
    fog?: boolean;
}

/**
 * Highlight water paint configuration.
 * 高亮水面样式配置
 * @category Paint
 */
export interface HighlightWaterPaint extends BasePaint {
    type: 'water-highlight';
    /** 水面颜色 */
    color?: number | string;
    /** 法线贴图URL */
    normalMap: string;
    /** 透明度 */
    opacity?: number;
}

/**
 * Water paint union type.
 * 水面样式联合类型
 * @category Paint
 */
export type WaterPaintUnion = SimpleWaterPaint | WaterPaint | HighlightWaterPaint;

/**
 * Model paint configuration.
 * 模型样式配置
 * @category Paint
 */
export interface ModelPaint extends BasePaint {
    /** Model URL 模型URL */
    url: string;
    /** Model type 模型类型 */
    type: 'model-gltf' | 'model-fbx';
    /** 位置 */
    position?: Vector3;
    /** 缩放 */
    scale?: number | Vector3 | { x?: number; y?: number; z?: number };
    /** 旋转 */
    rotation?: Vector3;
    /** 材质覆盖 */
    materialOverrides?: Record<string, Material>;
    /** 加载管理器 */
    manager?: LoadingManager;
    /** Draco压缩选项 */
    dracoOptions?: {
        /** 是否启用 */
        enable: boolean;
        /** 解码器路径 */
        decoderPath?: string;
    };
    /** 阴影配置 */
    shadows?: {
        /** 是否投射阴影 */
        cast?: boolean;
        /** 是否接收阴影 */
        receive?: boolean;
        /** 阴影质量 */
        quality?: 'low' | 'medium' | 'high';
    };
}


export interface LightPaint extends BasePaint {
    type: 'light';
    /** 点颜色 */
    color?: string | number | Color;
    /** 点大小 */
    size?: number;
    /** 图标URL */
    icon?: string;
}

/**
 * Point paint union type.
 * 点样式联合类型
 * @category Paint
 */
export type PointPaintUnion = CirclePaint | IconPaint | SymbolPaint | LightPaint | ModelPaint | TextPaint;

/**
 * Fill paint union type.
 * 面样式联合类型
 * @category Paint
 */
export type FillPaintUnion = FillPaint | ExtrusionPaint | WaterPaintUnion;

/**
 * Tube paint configuration.
 * 管道线样式配置
 * @category Paint
 */
export interface TubePaint extends BasePaint {
    type: 'tube';
    /** 管道颜色 */
    color?: string | number | Color;
    /** 管道半径 */
    radius: number;
    /** 圆柱分段数 */
    segments?: number;
    /** 是否包含端盖 */
    caps?: boolean;
    /** 流动贴图URL */
    flowTexture?: string;
    /** 压力值 */
    pressure?: number;
}

/**
 * Flow tube paint configuration.
 * 流动管线样式配置
 * @category Paint
 */
export interface FlowTubePaint extends BasePaint {
    type: 'flow-tube';
    /** 管道颜色 */
    color?: string | number | Color;
    /** 管道半径 */
    radius: number;
    /** 径向分段数 */
    radialSegments?: number;
    /** 管长分段数 */
    tubularSegments?: number;
    /** 速度因子 */
    speed?: number;
    /** 条纹宽度 */
    stripeWidth?: number;
    /** 条纹间距 */
    stripeSpacing?: number;
    /** 条纹颜色 */
    stripeColor?: string | number | Color;
    /** 拐角半径 */
    cornerRadius?: number;
    
}

/**
 * Arrow paint configuration.
 * 箭头流动线样式
 * @category Paint
 */
export interface ArrowPaint extends BasePaint {
    type: 'arrow';
    /** 箭头颜色 */
    color?: string | number | Color;
    /** 线条宽度 */
    width?: number;
    /** 箭头长度 */
    arrowLength?: number;
    /** 箭头间距 */
    arrowSpacing?: number;
    /** 速度因子 */
    speed?: number;
    /** 拐角半径 */
    cornerRadius?: number;
}


/**
 * Flow texture paint configuration.
 * 纹理流动线样式配置（发光箭头线等）
 * @category Paint
 */
export interface FlowTexturePaint extends BasePaint {
    type: 'flow-texture';
    /** 线颜色（与纹理颜色相乘，用于整体调色） */
    color?: string | number | Color;
    /** 线宽（世界坐标单位） */
    width?: number;
    /** 流动纹理 URL，例如箭头贴图 */
    flowTexture: string;
    /** 流动速度，越大流动越快 */
    speed?: number;
    /** 纹理沿线方向重复次数（控制箭头密度） */
    repeat?: number;
    /** 拐角半径（预留，与 FlowLineStyle 含义一致） */
    cornerRadius?: number;
}

/**
 * Line paint configuration.
 * 基础线样式配置
 * @category Paint
 */
export interface LinePaint extends BasePaint {
    type: 'line';
    /** 线颜色 */
    color?: string | number | Color;
    /** 线宽 */
    width?: number;
    /** 虚线模式 */
    dashArray?: [number, number];
    /** 透明度 */
    opacity?: number;
    /** 渲染层级 */
    zIndex?: number;
    /** 渲染器分辨率 */
    resolution?: Vector2;
}

/**
 * 云朵状态类型
  * @category Paint
 */
export type CloudState = {
    /** 引用组 */
    ref: Group
    /** 唯一标识 */
    uuid: string
    /** 索引 */
    index: number
    /** 分段数 */
    segments: number
    /** 距离 */
    dist: number
    /** 变换矩阵 */
    matrix: Matrix4
    /** 边界范围 */
    bounds: Vector3
    /** 位置 */
    position: Vector3
    /** 体积 */
    volume: number
    /** 长度 */
    length: number
    /** 速度 */
    speed: number
    /** 生长系数 */
    growth: number
    /** 透明度 */
    opacity: number
    /** 渐隐距离 */
    fade: number
    /** 密度 */
    density: number
    /** 旋转角度 */
    rotation: number
    /** 旋转因子 */
    rotationFactor: number
    /** 颜色 */
    color: Color
}

/**
 * 云朵属性配置
  * @category Paint
 */
export type CloudProps = {
    /** 随机种子 */
    seed?: number
    /** 分段/粒子数量 */
    segments?: number
    /** 3D边界范围 */
    bounds?: Vector3
    /** 分布方式 */
    concentrate?: 'random' | 'inside' | 'outside'
    /** 缩放比例 */
    scale?: Vector3
    /** 体积/厚度 */
    volume?: number
    /** 最小体积 */
    smallestVolume?: number
    /** 自定义分布函数 */
    distribute?: ((cloud: CloudState, index: number) => { point: Vector3; volume?: number }) | null
    /** 生长系数 */
    growth?: number
    /** 动画速度 */
    speed?: number
    /** 渐隐距离 */
    fade?: number
    /** 不透明度 */
    opacity?: number
    /** 颜色 */
    color?: Color,
    /** 十六进制颜色 */
    hexcolor?: string,
    /** 文本边界 */
    boundstext?: { x: number; y: number; z: number }
}

/**
 * Cloud paint configuration.
 * 云朵样式配置
 * @category Paint
 */
export type CloudPaint = BasePaint & CloudProps & {
    type: 'cloud'
}


/**
 * Line paint union type.
 * 线样式联合类型
 * @category Paint
 */
export type LinePaintUnion = LinePaint | TubePaint | FlowTubePaint | FlowTexturePaint | ArrowPaint;

/**
 * Custom paint configuration.
 * 自定义样式配置
 * @category Paint
 */
export interface CustomPaint extends BasePaint {
    type: 'custom';
    /** Build function 构建函数 */
    build: () => Object3D | Promise<Object3D>;
}

/**
 * Paint configuration union type.
 * 样式配置联合类型
 * @category Paint
 */
export type PaintConfig = PointPaintUnion | LinePaintUnion | FillPaintUnion | CloudPaint | CustomPaint;

/**
 * Paint input type.
 * 样式输入类型
 * @category Paint
 */
export type PaintInput = PaintConfig | Paint;

/**
 * Tile paint input type.
 * 矢量瓦片样式输入类型
 * @description 支持单个样式配置或数组
 * @category Paint
 */
export type TilePaintInput = PaintConfig | PaintConfig[];

/**
 * Paint class.
 * @description Manages and applies various 3D object paints/styles
 * @category Paint
 */
export class Paint {
    /** Texture cache */
    private static _textureCache = new Map<string, Texture>();
    /** Texture loader */
    private static _textureLoader = new TextureLoader();

    /**
     * Constructor
     * @param config Paint configuration
     */
    constructor(public config: PaintConfig) { }

    /**
     * 应用样式到3D对象
     * @param object 目标3D对象
     * @returns 是否应用成功
     */
    async applyTo(object: Object3D): Promise<boolean> {
        if (!object) return false;
        // console.log('apply style to object', object);
        try {
            // 可见性
            object.visible = this.config.visible !== false;

            // // === 统一渲染顺序：样式 + 图层 ===
            // const baseOrder = object.renderOrder || 0;

            // let zIndex = (this.config as BaseStyle).zIndex;
            // let depthOffset = (this.config as BaseStyle).depthOffset;

            // // 某一项没写时，尝试从所属图层补默认值
            // if (zIndex == null || depthOffset == null) {
            //     let parent: Object3D | null = object.parent;
            //     while (parent) {
            //         if (parent instanceof Feature) {
            //             const layer = (parent as any).getLayer?.();
            //             if (layer) {
            //                 const layerOpts = (layer as any).options || {};
            //                 if (zIndex == null && typeof layerOpts.zIndex === 'number') {
            //                     zIndex = layerOpts.zIndex;
            //                 }
            //                 if (depthOffset == null && typeof layerOpts.depthOffset === 'number') {
            //                     depthOffset = layerOpts.depthOffset;
            //                 }
            //                 // console.log('layer options', layerOpts);
            //             }
            //             break;
            //         }
            //         parent = parent.parent;
            //     }
            // }

            // const finalZIndex = zIndex ?? 0;
            // const finalDepthOffset = depthOffset ?? 0;

            // if (finalZIndex !== 0 || finalDepthOffset !== 0) {
            //     // 图层级 zIndex 决定大类顺序，depthOffset 做细调
            //     object.renderOrder = baseOrder + finalZIndex * 10 + finalDepthOffset;
            // }

            // // 如果有深度偏移，尽量在材质上同步 polygonOffset（主要给多边形用）
            // if (finalDepthOffset !== 0 && 'traverse' in object) {
            //     (object as any).traverse((child: any) => {
            //         const mat = (child as any).material;
            //         if (!mat) return;

            //         const materials = Array.isArray(mat) ? mat : [mat];
            //         materials.forEach((m: any) => {
            //             // console.log('material', m);
            //             if ('polygonOffset' in m) {
            //                 m.polygonOffset = true;
            //                 m.polygonOffsetFactor = finalDepthOffset;
            //                 m.polygonOffsetUnits = finalDepthOffset;
            //                 m.needsUpdate = true;
            //                 console.log('material updated ------------------- ', m);
            //             }
            //         });
            //     });
            // }



            switch (this.config.type) {
                case 'circle':
                case 'icon':
                case 'symbol':
                    return this._applyPointPaint(object);
                case 'line':
                    return this._applyLinePaint(object as Line2);
                case 'flow-tube':
                    return this._applyFlowTubePaint(object);
                case 'arrow':
                    return this._applyArrowPaint(object);
                case 'flow-texture':
                    return this._applyFlowTexturePaint(object);
                case 'model-gltf':
                case 'model-fbx':
                    return this._applyModelPaint(object);
                case 'fill':
                    return this._applyFillPaint(object);
                case 'extrusion':
                    return this._applyExtrusionPaint(object);
                case 'water':
                case 'water-simple':
                case 'water-highlight':
                    return this._applyWaterPaint(object);
                case 'cloud':
                    return this._applyCloudPaint(object);
                case 'text':
                case 'text-fixed':
                    return this._applyTextPaint(object);
                case 'light':
                    return this._applyLightPaint(object);
                case 'custom':
                    return this._applyCustomPaint(object);
                default:
                    throw new Error(`Unknown paint type`);
            }
        } catch (error) {
            console.error(`Paint apply failed:`, error);
            object.visible = false;
            return false;
        }
    }

    /**
     * Apply point paint
     * @param object Target object
     * @returns Success status
     */
    private async _applyPointPaint(object: Object3D): Promise<boolean> {
        const config = this.config as PointPaintUnion;

        if (config.type === 'icon') {
            await this._applyIconPaint(object, config);
        } else if (config.type === 'circle') {
            this._applyCirclePaint(object, config);
        } else if (config.type === 'symbol') {
            this._applySymbolPaint(object, config);
        }

        return true;
    }

    /**
     * Apply icon paint
     * @param object Target object
     * @param config Paint configuration
     */
    // @ts-ignore
    private async _applyIconPaint(object: Object3D, config: IconPaint) {
        // @ts-ignore
        let sprite: Sprite;

        // if (object instanceof Sprite) {
        //     sprite = object;
        // } else {
        //     sprite = await _createIconPoint(config, object.position)
        //     sprite.position.copy(object.position);
        //     sprite.rotation.copy(object.rotation);
        //     sprite.scale.copy(object.scale);
        //     // sprite.renderOrder = 999;

        //     if (object.parent) {
            //         let parent = object.parent as Feature;
            //         parent._renderObject = sprite;
            //         parent._updateGeometry();
            //     }
        // }

        // const size = config.size;
        // const [width, height] = Array.isArray(size) ? size : [size, size];
        // if (width <= 0 || height <= 0) {
        //     console.error("Invalid sprite size:", config.size);
        //     sprite.visible = false;
        //     return;
        // }

        // const material = sprite.material as SpriteMaterial;
        // try {
        //     material.map = await Style._loadTexture(config.url);
        //     if (!material.map) {
        //         throw new Error("Texture failed to load");
        //     }
        //     material.needsUpdate = true;
        //     sprite.scale.set(width, height, 1);
        //     if (config.rotation !== undefined) {
        //         sprite.rotation.z = config.rotation;
        //     }
        // } catch (error) {
        //     console.error("Failed to load texture:", config.url, error);
        //     sprite.visible = false;
        // }
        return true;
    }

    /**
     * Apply circle paint
     * @param object Target object
     * @param config Paint configuration
     */
    private _applyCirclePaint(object: Object3D, config: CirclePaint) {
        let points: Points;
        if (object instanceof Points) {
            points = object;
        } else {
            points = _createBasicPoint(config, object.position)
            points.position.copy(object.position);
            points.rotation.copy(object.rotation);
            points.scale.copy(object.scale);
            // points.renderOrder = 999;
            if (object.parent) {
                let parent = object.parent as Feature;
                parent._renderObject = points;
                parent._updateGeometry();
            }
        }

        const material = points.material as PointsMaterial;
        
        const isSizeAttenuation = config.sizeAttenuation;
        // Align with icon/label size scaling (pixelsToUnit = 0.002) when using size attenuation
        material.size = isSizeAttenuation ? config.size * 0.002 : config.size;
        
        if (config.color) material.color.set(config.color);
        material.sizeAttenuation = isSizeAttenuation ?? false;
        
        // Custom shader to render a circle
        material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <clipping_planes_fragment>`,
                `
                #include <clipping_planes_fragment>
                vec2 coord = gl_PointCoord - vec2(0.5);
                if(length(coord) > 0.5) discard;
                `
            );
        };
        material.needsUpdate = true;
    }

    /**
     * Apply symbol paint
     * @param object Target object
     * @param config Paint configuration
     */
    // @ts-ignore
    private _applySymbolPaint(object: Object3D, config: SymbolPaint) {
        return true
    }

    /**
     * Apply line paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyLinePaint(object: Object3D) {
        // @ts-ignore
        const config = this.config as LinePaint;
        // if (object.parent) {
        //     let parent = object.parent as Feature;
        //     parent._renderObject = _createBasicLine(config, parent._vertexPoints);
        //     parent._updateGeometry();
        // }
        return true;
    }

    /**
     * Apply flow tube paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyFlowTubePaint(object: Object3D) {
        return true;
    }

    /**
     * Apply arrow paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyArrowPaint(object: Object3D) {
        return true;
    }

    /**
     * Apply flow texture paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyFlowTexturePaint(object: Object3D) {
        return true;
    }

    /**
     * Apply fill paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyFillPaint(object: Object3D) {
        return true
    }

    /**
     * Apply extrusion paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyExtrusionPaint(object: Object3D) {
        return true
    }

    /**
     * Apply water paint
     * @param object Target object
     * @returns Success status
     */

    // @ts-ignore
    private _applyWaterPaint(object: Object3D) {
        return true
    }

    /**
     * Apply cloud paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyCloudPaint(object: Object3D) {
        return true
    }

    /**
     * Apply text paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private _applyTextPaint(object: Object3D) {
        return true
    }

    /**
    * Apply light paint
    * @param object Target object
    * @returns Success status
    */
    // @ts-ignore
    private _applyLightPaint(object: Object3D) {
        return true
    }

    /**
     * Apply model paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    private async _applyModelPaint(object: Object3D) {
        return true
    }

    /**
     * Apply custom paint
     * @param object Target object
     * @returns Success status
     */
    private async _applyCustomPaint(object: Object3D): Promise<boolean> {
        const config = this.config as CustomPaint;
        const customObj = await config.build();

        if (object instanceof Group) {
            object.clear();
            object.add(customObj);
        }
        return true;
    }

    /**
     * Load texture
     * @param url Texture URL
     * @returns Texture object
     */
    static async _loadTexture(url: string): Promise<Texture> {
        if (Paint._textureCache.has(url)) {
            return Paint._textureCache.get(url)!;
        }

        const texture = await new Promise<Texture>((resolve, reject) => {
            Paint._textureLoader.load(url, resolve, undefined, reject);
        });
        // texture.premultiplyAlpha = true;
        texture.needsUpdate = true;
        // texture.colorSpace = SRGBColorSpace;
        // texture.generateMipmaps = true;
        Paint._textureCache.set(url, texture);
        return texture;
    }

    /**
     * Create paint instance
     * @param input Paint input
     * @returns Paint instance
     */
    static create(input: PaintInput): Paint {
        return input instanceof Paint ? input : new Paint(input);
    }
}

// Export PaintRule from Layerstyle
export type { PaintRule } from './Layerstyle';
export type { LayerPaint } from './Layerstyle';

// Export matchFilter from filter
export { matchFilter } from './filter';