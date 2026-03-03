import {
    AmbientLight,
    DirectionalLight,
    Object3D,
    Scene,
    Vector3,
    CameraHelper
} from 'three';

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
export class SceneLightManager {
    /** Ambient light. 环境光 */
    private _ambientLight: AmbientLight | null = null;
    
    /** Main directional light. 主平行光 */
    private _directionalLight: DirectionalLight | null = null;
    
    /** Auxiliary lights. 辅助光源 */
    private _auxiliaryLights: DirectionalLight[] = [];
    
    /** Scene reference. 场景引用 */
    private _scene: Scene;
    
    /** World center position. 世界中心位置 */
    private _centerWorldPos: Vector3;
    
    /** Debug mode. 调试模式 */
    private _debug: boolean;

    /** Default light configuration. 默认光照配置 */
    private static readonly DEFAULT_CONFIG: Required<ILightConfig> = {
        ambientColor: 0xffffff,
        ambientIntensity: 2,
        directionalColor: 'rgba(248, 167, 16, 1)',
        directionalIntensity: 10,
        shadowMapSize: 10,
        shadowNear: 1,
        shadowFar: 192500,
        shadowCameraSize: 55000
    };

    /**
     * Create a scene light manager instance.
     * 创建场景光照管理器实例
     * 
     * @param scene - Three.js scene. Three.js场景
     * @param centerWorldPos - World center position. 世界中心位置
     * @param debug - Whether to enable debug mode. 是否启用调试模式
     */
    constructor(scene: Scene, centerWorldPos: Vector3, debug: boolean = false) {
        this._scene = scene;
        this._centerWorldPos = centerWorldPos;
        this._debug = debug;
    }

    /**
     * Initialize all lights.
     * 初始化所有光源
     */
    initialize(config?: ILightConfig): {
        ambientLight: AmbientLight;
        directionalLight: DirectionalLight;
    } {
        const mergedConfig = { ...SceneLightManager.DEFAULT_CONFIG, ...config };
        
        this._ambientLight = this._createAmbientLight(
            mergedConfig.ambientColor,
            mergedConfig.ambientIntensity
        );
        
        this._directionalLight = this._createDirectionalLight(mergedConfig);
        
        return {
            ambientLight: this._ambientLight,
            directionalLight: this._directionalLight
        };
    }

    /**
     * Create ambient light.
     * 创建环境光
     */
    private _createAmbientLight(color: number, intensity: number): AmbientLight {
        const ambLight = new AmbientLight(color, intensity);
        this._scene.add(ambLight);
        return ambLight;
    }

    /**
     * Create main directional light.
     * 创建主平行光
     */
    private _createDirectionalLight(config: Required<ILightConfig>): DirectionalLight {
        const x = 1.2;
        const y = 2;
        const z = 1;
        const size = config.shadowCameraSize;
        const mapSize = config.shadowMapSize;
        const near = config.shadowNear;
        const far = config.shadowFar;
        const radius = 1;
        const bias = 0;

        const dirLight = new DirectionalLight(config.directionalColor, config.directionalIntensity);
        dirLight.position.set(
            this._centerWorldPos.x + size * x,
            size * y,
            this._centerWorldPos.z + size * z
        );

        // Create and set target
        const targetObject = new Object3D();
        targetObject.position.copy(this._centerWorldPos);
        this._scene.add(targetObject);
        dirLight.target = targetObject;

        // Configure shadow
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024 * mapSize;
        dirLight.shadow.mapSize.height = 1024 * mapSize;
        dirLight.shadow.camera.near = near;
        dirLight.shadow.camera.far = far;
        dirLight.shadow.camera.left = -size;
        dirLight.shadow.camera.bottom = -size;
        dirLight.shadow.camera.top = size;
        dirLight.shadow.camera.right = size;
        dirLight.shadow.radius = radius;
        dirLight.shadow.bias = bias;

        this._scene.add(dirLight);
        this._scene.add(dirLight.target);

        // Add debug helper if in debug mode
        if (this._debug) {
            const cameraHelper = new CameraHelper(dirLight.shadow.camera);
            cameraHelper.name = 'dirLightCameraHelper';
            this._scene.add(cameraHelper);
        }

        return dirLight;
    }

    /**
     * Create auxiliary directional lights.
     * 创建辅助平行光
     */
    createAuxiliaryLights(intensity: number = 0.5): DirectionalLight[] {
        const size = SceneLightManager.DEFAULT_CONFIG.shadowCameraSize;

        // Back fill light
        const auxLight1 = this._createAuxiliaryLightInstance(
            this._centerWorldPos.x + size * -1.2,
            size * 1.5,
            this._centerWorldPos.z + size * -1,
            intensity,
            'AuxDirLight_BackFill'
        );

        // Left rim light
        const auxLight2 = this._createAuxiliaryLightInstance(
            this._centerWorldPos.x + size * -1.0,
            size * 1.5,
            this._centerWorldPos.z + size * 1.2,
            intensity,
            'AuxDirLight_LeftRim'
        );

        // Right rim light
        const auxLight3 = this._createAuxiliaryLightInstance(
            this._centerWorldPos.x + size * 1.0,
            size * 1.5,
            this._centerWorldPos.z + size * -1.2,
            intensity,
            'AuxDirLight_RightRim'
        );

        this._auxiliaryLights = [auxLight1, auxLight2, auxLight3];
        return this._auxiliaryLights;
    }

    /**
     * Create a single auxiliary light instance.
     * 创建单个辅助光源实例
     */
    private _createAuxiliaryLightInstance(
        x: number,
        y: number,
        z: number,
        intensity: number,
        name: string
    ): DirectionalLight {
        const auxLight = new DirectionalLight(0xffffff, intensity);
        auxLight.name = name;
        auxLight.position.set(x, y, z);

        // Target points to scene center
        const targetObject = new Object3D();
        targetObject.position.copy(this._centerWorldPos);
        this._scene.add(targetObject);
        auxLight.target = targetObject;
        auxLight.castShadow = false;

        this._scene.add(auxLight);
        this._scene.add(auxLight.target);

        return auxLight;
    }

    /**
     * Get ambient light.
     * 获取环境光
     */
    getAmbientLight(): AmbientLight | null {
        return this._ambientLight;
    }

    /**
     * Get directional light.
     * 获取平行光
     */
    getDirectionalLight(): DirectionalLight | null {
        return this._directionalLight;
    }

    /**
     * Get auxiliary lights.
     * 获取辅助光源
     */
    getAuxiliaryLights(): DirectionalLight[] {
        return this._auxiliaryLights;
    }

    /**
     * Set ambient light intensity.
     * 设置环境光强度
     */
    setAmbientIntensity(intensity: number): void {
        if (this._ambientLight) {
            this._ambientLight.intensity = intensity;
        }
    }

    /**
     * Set directional light intensity.
     * 设置平行光强度
     */
    setDirectionalIntensity(intensity: number): void {
        if (this._directionalLight) {
            this._directionalLight.intensity = intensity;
        }
    }

    /**
     * Update light target position.
     * 更新光源目标位置
     */
    updateLightTarget(newCenter: Vector3): void {
        this._centerWorldPos = newCenter;
        
        if (this._directionalLight?.target) {
            this._directionalLight.target.position.copy(newCenter);
        }

        this._auxiliaryLights.forEach(light => {
            if (light.target) {
                light.target.position.copy(newCenter);
            }
        });
    }

    /**
     * Dispose all lights.
     * 释放所有光源
     */
    dispose(): void {
        if (this._ambientLight) {
            this._scene.remove(this._ambientLight);
            this._ambientLight = null;
        }

        if (this._directionalLight) {
            if (this._directionalLight.target) {
                this._scene.remove(this._directionalLight.target);
            }
            this._scene.remove(this._directionalLight);
            this._directionalLight = null;
        }

        this._auxiliaryLights.forEach(light => {
            if (light.target) {
                this._scene.remove(light.target);
            }
            this._scene.remove(light);
        });
        this._auxiliaryLights = [];
    }
}
