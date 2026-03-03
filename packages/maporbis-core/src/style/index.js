/**
 * @module Paint
 */
import { Points, TextureLoader, Group, } from 'three';
import { _createBasicPoint } from '../utils/createobject';
/**
 * Paint class.
 * @description Manages and applies various 3D object paints/styles
 * @category Paint
 */
export class Paint {
    /**
     * Constructor
     * @param config Paint configuration
     */
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
    }
    /**
     * 应用样式到3D对象
     * @param object 目标3D对象
     * @returns 是否应用成功
     */
    async applyTo(object) {
        if (!object)
            return false;
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
                    return this._applyLinePaint(object);
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
        }
        catch (error) {
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
    async _applyPointPaint(object) {
        const config = this.config;
        if (config.type === 'icon') {
            await this._applyIconPaint(object, config);
        }
        else if (config.type === 'circle') {
            this._applyCirclePaint(object, config);
        }
        else if (config.type === 'symbol') {
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
    async _applyIconPaint(object, config) {
        // @ts-ignore
        let sprite;
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
    _applyCirclePaint(object, config) {
        let points;
        if (object instanceof Points) {
            points = object;
        }
        else {
            points = _createBasicPoint(config, object.position);
            points.position.copy(object.position);
            points.rotation.copy(object.rotation);
            points.scale.copy(object.scale);
            // points.renderOrder = 999;
            if (object.parent) {
                let parent = object.parent;
                parent._renderObject = points;
                parent._updateGeometry();
            }
        }
        const material = points.material;
        const isSizeAttenuation = config.sizeAttenuation;
        // Align with icon/label size scaling (pixelsToUnit = 0.002) when using size attenuation
        material.size = isSizeAttenuation ? config.size * 0.002 : config.size;
        if (config.color)
            material.color.set(config.color);
        material.sizeAttenuation = isSizeAttenuation ?? false;
        // Custom shader to render a circle
        material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(`#include <clipping_planes_fragment>`, `
                #include <clipping_planes_fragment>
                vec2 coord = gl_PointCoord - vec2(0.5);
                if(length(coord) > 0.5) discard;
                `);
        };
        material.needsUpdate = true;
    }
    /**
     * Apply symbol paint
     * @param object Target object
     * @param config Paint configuration
     */
    // @ts-ignore
    _applySymbolPaint(object, config) {
        return true;
    }
    /**
     * Apply line paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyLinePaint(object) {
        // @ts-ignore
        const config = this.config;
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
    _applyFlowTubePaint(object) {
        return true;
    }
    /**
     * Apply arrow paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyArrowPaint(object) {
        return true;
    }
    /**
     * Apply flow texture paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyFlowTexturePaint(object) {
        return true;
    }
    /**
     * Apply fill paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyFillPaint(object) {
        return true;
    }
    /**
     * Apply extrusion paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyExtrusionPaint(object) {
        return true;
    }
    /**
     * Apply water paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyWaterPaint(object) {
        return true;
    }
    /**
     * Apply cloud paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyCloudPaint(object) {
        return true;
    }
    /**
     * Apply text paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    _applyTextPaint(object) {
        return true;
    }
    /**
    * Apply light paint
    * @param object Target object
    * @returns Success status
    */
    // @ts-ignore
    _applyLightPaint(object) {
        return true;
    }
    /**
     * Apply model paint
     * @param object Target object
     * @returns Success status
     */
    // @ts-ignore
    async _applyModelPaint(object) {
        return true;
    }
    /**
     * Apply custom paint
     * @param object Target object
     * @returns Success status
     */
    async _applyCustomPaint(object) {
        const config = this.config;
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
    static async _loadTexture(url) {
        if (Paint._textureCache.has(url)) {
            return Paint._textureCache.get(url);
        }
        const texture = await new Promise((resolve, reject) => {
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
    static create(input) {
        return input instanceof Paint ? input : new Paint(input);
    }
}
/** Texture cache */
Object.defineProperty(Paint, "_textureCache", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
/** Texture loader */
Object.defineProperty(Paint, "_textureLoader", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new TextureLoader()
});
export { LayerPaint } from './Layerstyle';
// Export matchFilter from filter
export { matchFilter } from './filter';
