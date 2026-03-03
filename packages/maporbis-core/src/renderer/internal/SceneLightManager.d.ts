import { AmbientLight, DirectionalLight, Scene, Vector3 } from 'three';
/**
 * Light configuration interface.
 * 光照配置接口
 */
export interface ILightConfig {
    /** Ambient light color. 环境光颜色 */
    ambientColor?: number;
    /** Ambient light intensity. 环境光强度 */
    ambientIntensity?: number;
    /** Directional light color. 平行光颜色 */
    directionalColor?: string;
    /** Directional light intensity. 平行光强度 */
    directionalIntensity?: number;
    /** Shadow map size. 阴影贴图尺寸 */
    shadowMapSize?: number;
    /** Shadow near plane. 阴影近平面 */
    shadowNear?: number;
    /** Shadow far plane. 阴影远平面 */
    shadowFar?: number;
    /** Shadow camera size. 阴影相机尺寸 */
    shadowCameraSize?: number;
}
/**
 * Internal scene light manager for SceneRenderer class.
 * SceneRenderer类的内部场景光照管理器
 *
 * @description
 * Manages ambient light, directional lights, and auxiliary lights for the 3D scene.
 * 管理3D场景的环境光、平行光和辅助光源
 *
 * @internal
 */
export declare class SceneLightManager {
    /** Ambient light. 环境光 */
    private _ambientLight;
    /** Main directional light. 主平行光 */
    private _directionalLight;
    /** Auxiliary lights. 辅助光源 */
    private _auxiliaryLights;
    /** Scene reference. 场景引用 */
    private _scene;
    /** World center position. 世界中心位置 */
    private _centerWorldPos;
    /** Debug mode. 调试模式 */
    private _debug;
    /** Default light configuration. 默认光照配置 */
    private static readonly DEFAULT_CONFIG;
    /**
     * Create a scene light manager instance.
     * 创建场景光照管理器实例
     *
     * @param scene - Three.js scene. Three.js场景
     * @param centerWorldPos - World center position. 世界中心位置
     * @param debug - Whether to enable debug mode. 是否启用调试模式
     */
    constructor(scene: Scene, centerWorldPos: Vector3, debug?: boolean);
    /**
     * Initialize all lights.
     * 初始化所有光源
     */
    initialize(config?: ILightConfig): {
        ambientLight: AmbientLight;
        directionalLight: DirectionalLight;
    };
    /**
     * Create ambient light.
     * 创建环境光
     */
    private _createAmbientLight;
    /**
     * Create main directional light.
     * 创建主平行光
     */
    private _createDirectionalLight;
    /**
     * Create auxiliary directional lights.
     * 创建辅助平行光
     */
    createAuxiliaryLights(intensity?: number): DirectionalLight[];
    /**
     * Create a single auxiliary light instance.
     * 创建单个辅助光源实例
     */
    private _createAuxiliaryLightInstance;
    /**
     * Get ambient light.
     * 获取环境光
     */
    getAmbientLight(): AmbientLight | null;
    /**
     * Get directional light.
     * 获取平行光
     */
    getDirectionalLight(): DirectionalLight | null;
    /**
     * Get auxiliary lights.
     * 获取辅助光源
     */
    getAuxiliaryLights(): DirectionalLight[];
    /**
     * Set ambient light intensity.
     * 设置环境光强度
     */
    setAmbientIntensity(intensity: number): void;
    /**
     * Set directional light intensity.
     * 设置平行光强度
     */
    setDirectionalIntensity(intensity: number): void;
    /**
     * Update light target position.
     * 更新光源目标位置
     */
    updateLightTarget(newCenter: Vector3): void;
    /**
     * Dispose all lights.
     * 释放所有光源
     */
    dispose(): void;
}
