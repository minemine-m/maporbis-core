/**
 * @module SceneRenderer
 */
import { AmbientLight, Clock, Color, DirectionalLight, EventDispatcher, FogExp2, MathUtils, PerspectiveCamera, Scene, Vector3, WebGLRenderer, CubeTextureLoader, PCFSoftShadowMap, ACESFilmicToneMapping, FloatType, Object3D, MeshStandardMaterial, PlaneGeometry, Mesh, CameraHelper, CubicBezierCurve3, SRGBColorSpace, Vector2, WebGLRenderTarget, RGBAFormat, } from "three";
import { WebGPURenderer } from "three/webgpu";
import Stats from "three/addons/libs/stats.module.js";
import { MapControls, RGBELoader, EffectComposer, RenderPass, UnrealBloomPass, } from "three-stdlib";
import { Easing, Tween, update as teweenUpdate, } from "three/examples/jsm/libs/tween.module.js";
import { mapValue } from "../utils/validate";
import { BaseMixin, EventMixin } from "../core/mixins";
import { WebGPUCompat } from "../utils/WebGPUCompat";
// Create mixin base class, add generic parameter 创建混入基类，添加泛型参数
const SceneRendererBase = EventMixin(BaseMixin((EventDispatcher)));
/**
 * Three.js scene initialization class
 * Three.js场景初始化类
 * @extends EventDispatcher<SceneRendererEventMap>
 * @category SceneRenderer
 */
export class SceneRenderer extends SceneRendererBase {
    /**
     * 获取雾效因子
     */
    get fogFactor() {
        return this._fogFactor;
    }
    get isInteracting() {
        return this._isInteracting;
    }
    /**
     * 设置雾效因子（默认1）
     */
    set fogFactor(value) {
        this._fogFactor = value;
        this.controls.dispatchEvent({
            type: "change",
            target: this.controls,
        });
    }
    /**
     * 获取容器宽度
     */
    get width() {
        return this.container?.clientWidth || 0;
    }
    /**
     * 获取容器高度
     */
    get height() {
        return this.container?.clientHeight || 0;
    }
    /**
     * 构造函数
     * @param container 容器元素或选择器字符串
     * @param options 配置选项
     */
    constructor(container, options = {}) {
        super();
        /** Scene object 场景对象 */
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** WebGL renderer WebGL渲染器 */
        Object.defineProperty(this, "renderer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Perspective camera 透视相机 */
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Map controls 地图控制器 */
        Object.defineProperty(this, "controls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Ambient light 环境光 */
        Object.defineProperty(this, "ambLight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Directional light 平行光 */
        Object.defineProperty(this, "dirLight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 辅助平行光 (补光) */
        // public readonly auxDirLight: DirectionalLight;
        /** 云层效果 */
        Object.defineProperty(this, "clouds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** 容器元素 */
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 内部时钟 */
        Object.defineProperty(this, "_clock", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Clock()
        });
        /** 性能统计器 */
        // @ts-ignore
        Object.defineProperty(this, "stats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 动画回调集合 */
        Object.defineProperty(this, "_animationCallbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        /** 雾效因子 */
        Object.defineProperty(this, "_fogFactor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.0
        });
        Object.defineProperty(this, "_sceneSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50000 * 2
        });
        /** 地面网格 */
        Object.defineProperty(this, "_defaultGround", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 地图实例 */
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "centerWorldPos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_isInteracting", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** 是否启用调试模式 */
        Object.defineProperty(this, "debug", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "flyTween", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        /** 渲染器是否已准备就绪 (WebGPU需要异步初始化) */
        Object.defineProperty(this, "_isRendererReady", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** 后期处理：bloom 管线 */
        Object.defineProperty(this, "composer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "renderPass", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bloomPass", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Calculate camera position in world coordinates.
         * 计算相机在世界坐标系中的位置
         * @param target Target point (world coordinates) 目标点（世界坐标）
         * @param distance Distance from camera to target 相机到目标的距离
         * @param pitchRad Pitch angle in radians (0=top-down, Math.PI/2=horizontal) 俯仰角（弧度）
         * @param bearingRad Bearing angle in radians 方位角（弧度）
         * @returns Camera position (world coordinates) 相机位置（世界坐标）
         */
        Object.defineProperty(this, "calculateCameraPosition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (target, distance, pitchRad, bearingRad) => {
                // Use rotation matrix
                // Calculate camera at default position (south of target, +Z direction)
                const defaultOffset = new Vector3(0, // X component
                distance * Math.cos(pitchRad), // Y component
                distance * Math.sin(pitchRad));
                // Rotate around Y axis by bearing angle
                // Note: Three.js applyAxisAngle uses right-hand rule, counter-clockwise is positive
                defaultOffset.applyAxisAngle(new Vector3(0, 1, 0), bearingRad);
                return new Vector3(target.x + defaultOffset.x, target.y + defaultOffset.y, target.z + defaultOffset.z);
            }
        });
        // 手动设置 options
        this.setOptions(options);
        const { antialias = false, stencil = true, logarithmicDepthBuffer = true, skybox, map, bloom, minDistance, maxDistance, draggable = true, defaultGround, useWebGPU = false, } = options;
        // Set compatibility flag
        WebGPUCompat.setUseWebGPU(useWebGPU);
        this.map = map;
        this.centerWorldPos = this.map.lngLatToWorld(new Vector3(this.map.center[0], this.map.center[1], 0));
        this.renderer = this._createRenderer(antialias, stencil, logarithmicDepthBuffer, useWebGPU);
        if (useWebGPU && this.renderer instanceof WebGPURenderer) {
            this.renderer
                .init()
                .then(() => {
                this._isRendererReady = true;
                this.resize();
            })
                .catch((err) => {
                console.warn("WebGPU init failed, switching to WebGL:", err);
                // Fallback to WebGL
                WebGPUCompat.setUseWebGPU(false);
                // Remove broken WebGPU canvas
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
                // Re-create Renderer
                // @ts-ignore
                this.renderer = this._createRenderer(antialias, stencil, logarithmicDepthBuffer, false);
                this._isRendererReady = true;
                // Re-attach to container if it exists
                if (this.container) {
                    this.container.appendChild(this.renderer.domElement);
                }
            });
        }
        else {
            this._isRendererReady = true;
        }
        this.scene = this._createScene(skybox);
        this.camera = this._createCamera();
        if (container) {
            this.addTo(container);
        }
        this.controls = this._createControls(minDistance, maxDistance);
        // 初始化 draggable 状态
        this.controls.enabled = draggable !== false;
        this.ambLight = this._createAmbLight();
        this.scene.add(this.ambLight);
        this.dirLight = this._createDirLight();
        this.scene.add(this.dirLight);
        this.scene.add(this.dirLight.target);
        // 创建并添加辅助光
        // this.auxDirLight = this._createAuxDirLight();
        // this.scene.add(this.auxDirLight);
        // this.scene.add(this.auxDirLight.target);
        // 创建并添加头光
        // this.headlight = this._createHeadlight();
        // this.scene.add(this.headlight);
        // this.scene.add(this.headlight.target);
        this._defaultGround = this._createDefaultGround(defaultGround);
        if (defaultGround?.enabled) {
            this.scene.add(this._defaultGround);
        }
        // 初始化 bloom 管线：普通渲染 + UnrealBloomPass
        // TODO: Support post-processing in WebGPU (requires TSL-based postprocessing)
        if (bloom && bloom.enabled && !useWebGPU) {
            const pixelRatio = this.renderer.getPixelRatio();
            const width = this.container ? this.width : window.innerWidth;
            const height = this.container ? this.height : window.innerHeight;
            const rtWidth = width * pixelRatio;
            const rtHeight = height * pixelRatio;
            // 使用 WebGLRenderTarget，并通过 samples 开启 MSAA（WebGL2 下生效）
            const renderTarget = new WebGLRenderTarget(rtWidth, rtHeight, {
                format: RGBAFormat,
            });
            // three r171 支持在 WebGLRenderTarget 上直接设置 samples
            renderTarget.samples = 4; // 4x MSAA，必要时可调成 2
            this.composer = new EffectComposer(this.renderer, renderTarget);
            this.renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);
            const bloomStrength = bloom?.strength ?? 1.5;
            const bloomRadius = bloom?.radius ?? 1.0;
            const bloomThreshold = bloom?.threshold ?? 0.7;
            this.bloomPass = new UnrealBloomPass(new Vector2(rtWidth, rtHeight), bloomStrength, bloomRadius, bloomThreshold);
            this.composer.addPass(this.bloomPass);
        }
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.debug = options.debug || false;
        this.flyTween = null;
        if (this.debug) {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
        }
    }
    /**
     * Add renderer to container
     * 将渲染器添加到容器
     * @param container Container element or selector string 容器元素或选择器字符串
     * @returns this
     */
    addTo(container) {
        let el = null;
        if (typeof container === "string") {
            el =
                document.getElementById(container) || document.querySelector(container);
        }
        else {
            el = container;
        }
        if (el instanceof HTMLElement) {
            this.container = el;
            el.appendChild(this.renderer.domElement);
            new ResizeObserver(this.resize.bind(this)).observe(el);
        }
        else {
            throw `${container} not found!`;
        }
        return this;
    }
    /**
     * Create scene
     * 创建场景
     * @param skyboxConfig Skybox configuration 天空盒配置
     * @returns Scene object 场景对象
     */
    _createScene(skyboxConfig) {
        const scene = new Scene();
        const backColor = skyboxConfig?.defaultColor || "rgb(21,48,94)";
        scene.background = new Color(backColor);
        scene.fog = new FogExp2(backColor, 0.0002);
        if (skyboxConfig?.files) {
            const loader = new CubeTextureLoader();
            if (skyboxConfig.path) {
                loader.setPath(skyboxConfig.path);
            }
            loader.load(skyboxConfig.files, (texture) => {
                // texture.colorSpace = SRGBColorSpace;
                scene.background = texture;
                // scene.environment = texture;
            }, undefined, (error) => {
                console.error("Error loading skybox:", error);
                scene.background = new Color(backColor);
            });
        }
        else if (skyboxConfig?.hdr) {
            this._loadHDRWithPMREM(scene, skyboxConfig);
        }
        return scene;
    }
    /**
     * 使用PMREM加载HDR环境贴图
     * @param scene 场景对象
     * @param skyboxConfig 天空盒配置
     */
    async _loadHDRWithPMREM(scene, skyboxConfig) {
        try {
            if (skyboxConfig) {
                const hdrLoader = new RGBELoader()
                    .setPath(skyboxConfig.path || "")
                    .setDataType(FloatType);
                const hdrTexture = await hdrLoader.loadAsync(skyboxConfig.hdr);
                // hdrTexture.intensity = skyboxConfig.hdrIntensity || 1.0;
                // hdrTexture.intensity
                // 设置HDR纹理
                // hdrTexture.colorSpace = this.renderer.outputColorSpace;
                hdrTexture.mapping = 303;
                hdrTexture.needsUpdate = true;
                // 关键：设置为场景的环境贴图
                this.scene.environment = hdrTexture;
                // 可选：同时作为背景显示
                this.scene.background = hdrTexture;
                // scene.environmentIntensity = 0.000001; // 默认值 1.0
                // 控制环境光强度 - 这里控制HDR亮度
                // this.scene.environmentIntensity = 0.00001;
                // 控制背景亮度（如果需要独立控制）
                this.scene.backgroundIntensity = 1.1;
                // hdrTexture.dispose();
            }
        }
        catch (error) {
            console.error("加载HDR失败:", error);
            scene.background = new Color(skyboxConfig?.defaultColor || 0xdbf0ff);
        }
    }
    /**
     * 创建WebGL渲染器
     * @param antialias 是否抗锯齿
     * @param stencil 是否使用模板缓冲区
     * @param logarithmicDepthBuffer 是否使用对数深度缓冲区
     * @param useWebGPU 是否使用WebGPU
     * @returns 渲染器对象
     */
    _createRenderer(antialias, stencil, logarithmicDepthBuffer, useWebGPU = false) {
        if (useWebGPU) {
            const renderer = new WebGPURenderer({
                antialias,
                stencil,
                alpha: true,
                // WebGPU 暂不支持 logarithmicDepthBuffer，强制关闭以避免 Shader 注入无用代码导致精度问题
                logarithmicDepthBuffer: false,
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.toneMapping = ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1;
            renderer.outputColorSpace = SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = PCFSoftShadowMap;
            renderer.domElement.tabIndex = 0;
            return renderer;
        }
        const renderer = new WebGLRenderer({
            antialias,
            logarithmicDepthBuffer,
            stencil,
            alpha: true,
            precision: "highp",
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: true,
        });
        // const renderer = new WebGLRenderer({
        //     antialias: true, // 开启抗锯齿,
        //     logarithmicDepthBuffer: true, // 防闪烁
        //     alpha: true,
        //     precision: "highp",
        // });
        renderer.debug.checkShaderErrors = true;
        // renderer.physicallyCorrectLights = true;
        renderer.sortObjects = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.domElement.tabIndex = 0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.type = PCFSoftShadowMap;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.outputColorSpace = SRGBColorSpace;
        // renderer.outputColorSpace = "srgb-linear";
        // renderer.outputEncoding = LinearEncoding;
        // if (renderer.capabilities.isWebGL2) {
        //     const gl = renderer.getContext();
        //     gl.getExtension('EXT_color_buffer_float');
        //     gl.getExtension('OES_texture_float_linear');
        // }
        return renderer;
    }
    /**
     * Create camera
     * 创建相机
     * @returns Camera object 相机对象
     */
    _createCamera() {
        // const camera = new PerspectiveCamera(70, 1, 100, 5e4);
        // camera.position.set(0, 3e4 * 1000, 0);
        // return camera;
        // dt
        const camera = new PerspectiveCamera(45, this.getAspect(), 0.1, this._sceneSize * 2);
        return camera;
        // 创建正交相机消除透视变形
        // const orthoCamera = new OrthographicCamera(
        //     -window.innerWidth / 2,   // left
        //     window.innerWidth / 2,    // right
        //     window.innerHeight / 2,   // top
        //     -window.innerHeight / 2,  // bottom
        //     0.1,                     // near
        //     1000000                   // far
        // );
        // return orthoCamera;
        // 保持原有相机位置
        // orthoCamera.position.copy(this.sceneRenderer.camera.position);
        // orthoCamera.lookAt(this.sceneRenderer.controls.target);
    }
    /**
     * Create map controls
     * 创建地图控制器
     * @param minDistance Minimum zoom distance 最小缩放距离
     * @param maxDistance Maximum zoom distance 最大缩放距离
     * @returns Controls object 控制器对象
     */
    _createControls(minDistance, maxDistance) {
        const controls = new MapControls(this.camera, this.renderer.domElement);
        // Fix: [Violation] Added non-passive event listener to a scroll-blocking 'touchmove' event.
        // Explicitly set touch-action to none to tell the browser that the browser's default 
        // touch actions (scrolling, zooming) should be disabled on this element.
        // This allows MapControls to handle touch events without browser interference and eliminates the warning.
        this.renderer.domElement.style.touchAction = 'none';
        const MAX_POLAR_ANGLE = Math.PI / 2.1;
        // controls.target.set(0, 0, -3e3);
        controls.screenSpacePanning = false;
        controls.minDistance = minDistance ?? 0.1;
        controls.maxDistance = maxDistance ?? 60000;
        controls.maxPolarAngle = MAX_POLAR_ANGLE;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.keyPanSpeed = 1;
        controls.listenToKeyEvents(this.renderer.domElement);
        controls.addEventListener("change", () => {
            const polar = Math.max(controls.getPolarAngle(), 0.1);
            const dist = Math.max(controls.getDistance(), 100);
            controls.zoomSpeed = Math.max(Math.log(dist / 1e3), 1) + 3;
            const maxFar = 300000 * 2;
            if (controls.maxDistance > maxFar * 0.95)
                controls.maxDistance = maxFar * 0.95;
            this.camera.far = MathUtils.clamp((dist / polar) * 8, 100, maxFar);
            // 动态调整 near 平面，避免在大场景下因 near 过小导致的 Z-fighting
            // WebGPU 下 logarithmicDepthBuffer 可能未完全生效，需通过优化视锥体范围来保证精度
            // 优化：增加阈值判断，避免每帧频繁更新 ProjectionMatrix 导致 WebGPU 下的抖动
            const newNear = Math.max(0.1, dist / 100);
            if (Math.abs(this.camera.near - newNear) > newNear * 0.1) {
                this.camera.near = newNear;
                this.camera.updateProjectionMatrix();
            }
            if (this.scene.fog instanceof FogExp2) {
                // this.scene.fog.density = (polar / (dist + 5)) * this.fogFactor * 0.375;
                this.scene.fog.density = (polar / (dist + 5)) * this.fogFactor * 0.1;
            }
            const DIST_THRESHOLD = 60000;
            const isDistAboveThreshold = dist > DIST_THRESHOLD;
            controls.minAzimuthAngle = isDistAboveThreshold ? 0 : -Infinity;
            controls.maxAzimuthAngle = isDistAboveThreshold ? 0 : Infinity;
            // const POLAR_BASE = 1e7;
            // const POLAR_EXPONENT = 4;
            // controls.maxPolarAngle = Math.min(Math.pow(POLAR_BASE / dist, POLAR_EXPONENT), MAX_POLAR_ANGLE);
            controls.maxPolarAngle = mapValue(controls.getDistance(), 0, 70000, MAX_POLAR_ANGLE, 0);
            // 此处绑定map的事件
            // console.log(this.map,'我的map ----------------- ')
            this.map?.fire("viewchange", {
                type: "control-change",
                control: controls,
                camera: this.camera,
                target: this.map,
            });
        });
        // 注册控制器开始事件
        controls.addEventListener("start", () => {
            this._isInteracting = true;
            this.map?.fire("movestart", {
                type: "control-start",
                control: controls,
                camera: this.camera,
                target: this.map,
            });
        });
        // 注册控制器开始事件
        controls.addEventListener("end", () => {
            this._isInteracting = false;
            this.map?.fire("moveend", {
                type: "control-end",
                control: controls,
                camera: this.camera,
                target: this.map,
            });
        });
        return controls;
    }
    /**
     * Create ambient light
     * 创建环境光
     * @returns Ambient light object 环境光对象
     */
    _createAmbLight() {
        const ambLight = new AmbientLight(0xffffff, 2);
        return ambLight;
    }
    /**
     * 创建平行光
     * @returns 平行光对象
     */
    _createDirLight() {
        const x = 1.2;
        const y = 2;
        const z = 1;
        const size = 55000;
        // 修复 WebGPU Texture Limit 错误：将 mapSize 从 10 (10240) 降低到 8 (8192)
        // 大多数设备的 maxTextureDimension2D 至少为 8192
        const mapSize = 8;
        const near = 1;
        const far = size * 3.5;
        const radius = 1;
        const bias = -0.0001 * 0;
        const intensity = 10;
        const dirLight = new DirectionalLight("rgba(248, 167, 16, 1)", intensity);
        dirLight.position.set(this.centerWorldPos.x + size * x, size * y, this.centerWorldPos.z + size * z);
        const targetObject = new Object3D();
        targetObject.position.copy(this.centerWorldPos);
        this.scene.add(targetObject);
        dirLight.target = targetObject;
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
        if (this.debug) {
            const cameraHelper = new CameraHelper(dirLight.shadow.camera);
            cameraHelper.name = "dirLightCameraHelper";
            this.scene.add(cameraHelper);
        }
        return dirLight;
    }
    /**
     * 创建三个辅助平行光 (后补光、左侧光、右侧光)，指向场景中心。
     * @returns 返回后补光实例 (匹配 this.auxDirLight 属性)
     * @internal Reserved for future use
     */
    // @ts-ignore - Reserved method for auxiliary light creation
    _createAuxDirLight() {
        const size = 55000;
        const intensity = 0.5; // 辅助光强度
        // ----------------------------------------------------
        // Aux Light 1 (后补光 / Back Fill - 与主光(1.2, 1)对向)
        // ----------------------------------------------------
        const x1 = -1.2;
        const z1 = -1;
        const y1 = 1.5;
        const auxLight1 = this._createAuxLightInstance(this.centerWorldPos.x + size * x1, size * y1, this.centerWorldPos.z + size * z1, intensity);
        auxLight1.name = "AuxDirLight_BackFill";
        this.scene.add(auxLight1);
        this.scene.add(auxLight1.target); // 目标点已在 _createAuxLightInstance 中添加，这里是多余的，但保留以防万一
        // ----------------------------------------------------
        // Aux Light 2 (左侧光 / Left Rim - 与主光近似垂直)
        // ----------------------------------------------------
        const x2 = -1.0;
        const z2 = 1.2;
        const y2 = 1.5;
        const auxLight2 = this._createAuxLightInstance(this.centerWorldPos.x + size * x2, size * y2, this.centerWorldPos.z + size * z2, intensity);
        auxLight2.name = "AuxDirLight_LeftRim";
        this.scene.add(auxLight2);
        this.scene.add(auxLight2.target);
        // ----------------------------------------------------
        // Aux Light 3 (右侧光 / Right Rim - 与左侧光对向)
        // ----------------------------------------------------
        const x3 = 1.0;
        const z3 = -1.2;
        // const y3 = 1.5;
        const auxLight3 = this._createAuxLightInstance(this.centerWorldPos.x + size * x3, size * y1, this.centerWorldPos.z + size * z3, intensity);
        auxLight3.name = "AuxDirLight_RightRim";
        this.scene.add(auxLight3);
        this.scene.add(auxLight3.target);
        // 返回第一个辅助光实例，以匹配 this.auxDirLight 属性
        return auxLight1;
    }
    /**
     * Create a single auxiliary directional light instance.
     * 创建单个辅助平行光实例。
     * @param x Light source world X coordinate 光源的世界X坐标
     * @param y Light source world Y coordinate 光源的世界Y坐标
     * @param z Light source world Z coordinate 光源的世界Z坐标
     * @param intensity Light intensity 光源强度
     * @returns DirectionalLight
     */
    _createAuxLightInstance(x, y, z, intensity) {
        const auxLight = new DirectionalLight(0xffffff, intensity);
        auxLight.position.set(x, y, z);
        // 目标点：始终指向场景中心
        const targetObject = new Object3D();
        targetObject.position.copy(this.centerWorldPos);
        this.scene.add(targetObject);
        auxLight.target = targetObject;
        auxLight.castShadow = false;
        return auxLight;
    }
    /**
     * Resize container
     * 调整容器大小
     * @returns this
     */
    resize() {
        if (!this._isRendererReady)
            return this;
        const width = this.width;
        const height = this.height;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if (this.composer) {
            const pixelRatio = this.renderer.getPixelRatio();
            this.composer.setSize(width * pixelRatio, height * pixelRatio);
            this.composer.render();
        }
        else {
            this.renderer.render(this.scene, this.camera);
        }
        return this;
    }
    /**
     * 添加动画回调
     * @param callback 回调函数，接收deltaTime和elapsedTime参数
     * @returns 移除回调的函数
     */
    addAnimationCallback(callback) {
        this._animationCallbacks.add(callback);
        return () => this._animationCallbacks.delete(callback);
    }
    /**
     * 动画循环
     */
    animate() {
        if (!this._isRendererReady)
            return;
        const delta = this._clock.getDelta();
        const elapsedtime = this._clock.getElapsedTime();
        this._animationCallbacks.forEach((cb) => cb(delta, elapsedtime, this));
        this.controls.update();
        // 显式更新相机矩阵，确保在渲染前相机位置已同步（特别是对于WebGPU的异步特性）
        this.camera.updateMatrixWorld();
        // WebGPU 大坐标抖动修复：Floating Origin (动态原点)
        // 当相机距离原点过远时，在渲染帧将整个场景平移到相机下方，
        // 使得相机处于 (0,0,0) 附近，从而避免 GPU 浮点精度丢失。
        const isWebGPU = this.renderer instanceof WebGPURenderer;
        const threshold = 10000;
        let offset = null;
        const originalScenePos = this.scene.position.clone();
        const originalCameraPos = this.camera.position.clone();
        if (isWebGPU && originalCameraPos.length() > threshold) {
            offset = originalCameraPos.clone();
            offset.y = 0; // 保留高度信息？不，全移。通常地图在 XZ 平面，Y 是高度。
            // 如果 Y 很大（例如高空视角），也需要移。
            // 但是保留 offset.y = 0 可以让高度保持直观，不过为了精度最好全移。
            // 重新决定：全移。
            // 1. 移动场景
            this.scene.position.sub(offset);
            this.scene.updateMatrixWorld(true);
            // 2. 重置相机
            this.camera.position.sub(offset);
            this.camera.updateMatrixWorld();
        }
        // 核心修正：在渲染前调用更新函数，同步光源位置
        // this._updateHeadlightPosition();
        // this.renderer.render(this.scene, this.camera);
        if (this.composer) {
            this.composer.render();
        }
        else {
            this.renderer.render(this.scene, this.camera);
        }
        // Restore
        if (offset) {
            this.scene.position.copy(originalScenePos);
            this.camera.position.copy(originalCameraPos);
            // 必须更新场景矩阵，否则下一帧 LOD 计算会使用偏移后的错误矩阵，导致距离计算为极大值（只加载 1 级瓦片）
            this.scene.updateMatrixWorld(true);
            // 相机矩阵也建议恢复，虽然 controls.update 会覆盖，但为了逻辑完备性
            this.camera.updateMatrixWorld();
        }
        teweenUpdate();
        if (this.stats) {
            this.stats.update();
        }
        this.fire("update", { delta });
    }
    /**
     * Fly to specified position
     * 飞行到指定位置
     * @param centerWorldPos Map center target position (world coordinates) 地图中心目标位置（世界坐标）
     * @param cameraWorldPos Camera target position (world coordinates) 相机目标位置（世界坐标）
     * @param animate Whether to enable animation 是否启用动画
     * @param onComplete Completion callback 完成回调
     */
    flyTo(centerWorldPos, cameraWorldPos, animate = true, onComplete) {
        this.controls.target.copy(centerWorldPos);
        if (animate) {
            const start = this.camera.position;
            new Tween(start)
                .to({ y: 2e7, z: 0 }, 500)
                .chain(new Tween(start)
                .to(cameraWorldPos, 2000)
                .easing(Easing.Quintic.Out)
                .onComplete((obj) => onComplete && onComplete(obj)))
                .start();
        }
        else {
            this.camera.position.copy(cameraWorldPos);
        }
    }
    /**
     * Advanced fly to specified position method
     * 高级飞行到指定位置的方法
     *
     * Supports both straight and curved flight paths, allowing customization of flight duration, delay, and completion callback.
     * Achieves smooth camera movement and view transition via Tween animation.
     * 支持直线和曲线两种飞行路径，可以自定义飞行持续时间、延迟和完成回调。
     * 通过Tween动画实现平滑的相机移动和视角过渡。
     *
     * @param options - Flight configuration options 飞行配置选项
     * @param options.center - Target center point longitude and latitude coordinates 目标中心点的经纬度坐标
     * @param options.cameraCoord - Camera target position longitude and latitude coordinates 相机目标位置的经纬度坐标
     * @param options.duration - Flight animation duration (ms), default 2000ms 飞行动画持续时间（毫秒），默认2000ms
     * @param options.delay - Delay before flight starts (ms), default 0ms 开始飞行前的延迟时间（毫秒），默认0ms
     * @param options.complete - Callback function when flight completes 飞行完成时的回调函数
     * @param options.curvePath - Whether to use curved flight path, true for cubic Bezier curve, false for straight line (default) 是否使用曲线路径飞行，true为三次贝塞尔曲线，false为直线（默认）
     *
     *
     * @remarks
     * - If there is an ongoing flight animation, it will be stopped automatically
     * - Camera position, view, and target point will be updated during flight
     * - Curved path uses cubic Bezier curve, control points are automatically generated
     * - Longitude and latitude coordinates will be automatically converted to world coordinates
     * - 如果之前有正在进行的飞行动画，会自动停止
     * - 飞行过程中会更新相机位置、视角和目标点
     * - 曲线路径使用三次贝塞尔曲线，控制点自动生成
     * - 经纬度坐标会自动转换为世界坐标
     *
     * @throws Returns silently when center or cameraCoord parameters are invalid, no exception thrown 当center或cameraCoord参数无效时静默返回，不抛出异常
     */
    flyToAdvanced(options) {
        const camera = this.camera;
        const controls = this.controls;
        const centerGeo = options.center;
        const duration = options.duration ?? 2000;
        const delay = options.delay ?? 0;
        const complete = options.complete;
        const useCurvePath = !!options.curvePath;
        if (!centerGeo)
            return;
        const centerWorldPos = this.map.lngLatToWorld(new Vector3(centerGeo[0], centerGeo[1], 0));
        if (!camera || !controls || !centerWorldPos)
            return;
        // 如果提供了 cameraCoord，使用原有逻辑
        if (options.cameraCoord) {
            const cameraGeo = options.cameraCoord;
            const cameraWorldPos = this.map.lngLatToWorld(new Vector3(cameraGeo[0], cameraGeo[1], cameraGeo[2]));
            if (!cameraWorldPos)
                return;
            // 克隆目标和相机位置
            const targetStart = controls.target.clone();
            const positionStart = camera.position.clone();
            const targetEnd = new Vector3(centerWorldPos.x, centerWorldPos.y, centerWorldPos.z);
            const positionEnd = new Vector3(cameraWorldPos.x, cameraWorldPos.y, cameraWorldPos.z);
            // 停止之前的动画
            if (this.flyTween) {
                this.flyTween.stop();
                this.flyTween = null;
            }
            // 直线 / 曲线由 curvePath 控制，默认直线
            if (!useCurvePath) {
                const tweenObj = {
                    tx: targetStart.x,
                    ty: targetStart.y,
                    tz: targetStart.z,
                    px: positionStart.x,
                    py: positionStart.y,
                    pz: positionStart.z,
                };
                this.flyTween = new Tween(tweenObj)
                    .to({
                    tx: targetEnd.x,
                    ty: targetEnd.y,
                    tz: targetEnd.z,
                    px: positionEnd.x,
                    py: positionEnd.y,
                    pz: positionEnd.z,
                }, duration)
                    .easing(Easing.Quadratic.InOut)
                    .onUpdate(() => {
                    const newTarget = new Vector3(tweenObj.tx, tweenObj.ty, tweenObj.tz);
                    const newPosition = new Vector3(tweenObj.px, tweenObj.py, tweenObj.pz);
                    camera.position.copy(newPosition);
                    camera.lookAt(newTarget);
                    controls.target.copy(newTarget);
                    controls.update();
                    // 渲染交给全局 animate 中的 renderer.render
                });
            }
            else {
                // 曲线路径版本
                const points = [
                    positionStart,
                    positionStart.clone().lerp(positionEnd, 0.33),
                    positionStart.clone().lerp(positionEnd, 0.67),
                    positionEnd,
                ];
                const curve = new CubicBezierCurve3(...points);
                const tweenObj = {
                    t: 0,
                    x: targetStart.x,
                    y: targetStart.y,
                    z: targetStart.z,
                };
                this.flyTween = new Tween(tweenObj)
                    .to({
                    t: 1,
                    x: targetEnd.x,
                    y: targetEnd.y,
                    z: targetEnd.z,
                }, duration)
                    .easing(Easing.Quadratic.InOut)
                    .onUpdate(() => {
                    const newPosition = curve.getPoint(tweenObj.t);
                    const newTarget = new Vector3(tweenObj.x, tweenObj.y, tweenObj.z);
                    camera.position.copy(newPosition);
                    camera.lookAt(newTarget);
                    camera.updateProjectionMatrix();
                    controls.target.copy(newTarget);
                    controls.update();
                });
            }
            if (!this.flyTween)
                return;
            this.flyTween.onComplete(() => {
                if (this.flyTween) {
                    this.flyTween.stop();
                    this.flyTween = null;
                }
                if (complete)
                    complete();
            });
            if (delay > 0) {
                setTimeout(() => {
                    if (this.flyTween) {
                        this.flyTween.start();
                    }
                }, delay);
            }
            else {
                this.flyTween.start();
            }
        }
        else {
            // 使用 distance/pitch/bearing 参数
            const distance = typeof options.distance === "number"
                ? options.distance
                : controls.getDistance();
            // === Convert degrees to radians ===
            const toRad = (deg) => (deg * Math.PI) / 180;
            // Avoid polar singularity: when pitch <= 0, use a small angle
            let pitchRad;
            if (typeof options.pitch === "number") {
                const safePitch = options.pitch <= 0 ? 0.1 : options.pitch;
                pitchRad = toRad(safePitch);
            }
            else {
                pitchRad = controls.getPolarAngle();
            }
            const bearingRad = typeof options.bearing === "number"
                ? toRad(options.bearing)
                : controls.getAzimuthalAngle();
            const targetWorld = centerWorldPos;
            const newCameraPosition = this.calculateCameraPosition(targetWorld, distance, pitchRad, bearingRad);
            const newCameraGeo = this.map.worldToLngLat(newCameraPosition);
            // 递归调用自己，但这次使用 cameraCoord 参数
            this.flyToAdvanced({
                center: [centerGeo[0], centerGeo[1], 0],
                cameraCoord: [newCameraGeo.x, newCameraGeo.y, newCameraGeo.z || 0],
                duration,
                delay,
                complete,
                curvePath: useCurvePath,
            });
        }
    }
    /**
     * Options change callback.
     * 配置更新回调
     * Triggered when sceneRenderer.configure() is called to update options.
     * 当调用 sceneRenderer.configure() 更新配置时，会触发此方法
     */
    onOptionsChange(conf) {
        // Handle draggable option
        // 处理 draggable 配置
        if ("draggable" in conf) {
            const draggable = conf.draggable;
            if (this.controls) {
                // Control whether controls are enabled
                // 控制 controls 是否启用
                this.controls.enabled = draggable !== false;
            }
        }
    }
    /**
     * 飞行到指定点，自动计算相机位置
     * @param center 目标点的经纬度坐标
     * @param options 飞行选项
     */
    easeTo(options) {
        const { controls } = this;
        const center = options.center;
        const duration = options.duration ?? 2000;
        const distance = typeof options.distance === "number"
            ? options.distance
            : typeof options.altitude === "number"
                ? options.altitude
                : controls.getDistance();
        // === Convert degrees to radians ===
        const toRad = (deg) => (deg * Math.PI) / 180;
        // Avoid polar singularity: when pitch <= 0, use a small angle
        let pitchRad;
        if (typeof options.pitch === "number") {
            const safePitch = options.pitch <= 0 ? 0.1 : options.pitch;
            pitchRad = toRad(safePitch);
        }
        else {
            pitchRad = controls.getPolarAngle();
        }
        const bearingRad = typeof options.bearing === "number"
            ? toRad(options.bearing)
            : controls.getAzimuthalAngle();
        const complete = options.complete;
        const useCurvePath = !!options.curvePath;
        const targetWorld = this.map.lngLatToWorld(new Vector3(center[0], center[1], 0));
        const newCameraPosition = this.calculateCameraPosition(targetWorld, distance, pitchRad, bearingRad);
        // const minHeight = distance * 0.5;
        // if (newCameraPosition.y < minHeight) newCameraPosition.y = minHeight;
        const newCameraGeo = this.map.worldToLngLat(newCameraPosition);
        this.flyToAdvanced({
            center: [center[0], center[1], 0],
            cameraCoord: [newCameraGeo.x, newCameraGeo.y, newCameraGeo.z || 0],
            duration,
            complete,
            curvePath: useCurvePath,
        });
    }
    /**
     * Get current scene state
     * 获取当前场景状态
     * @returns Object containing center position and camera position 包含中心位置和相机位置的对象
     */
    getState() {
        return {
            centerPosition: this.controls.target,
            cameraPosition: this.camera.position,
        };
    }
    /**
     * Bind map instance
     * 绑定地图实例
     * @param map Map instance 地图实例
     *
     * @protected
     */
    _bindMap(map) {
        if (!map)
            return;
        this.map = map;
    }
    /**
     * Get associated map instance
     * 获取关联的地图实例
     * @returns Map instance or null 地图实例或null
     */
    getMap() {
        if (this.map) {
            return this.map;
        }
        return null;
    }
    // dt的方法
    /**
     * Get current browser window aspect ratio.
     * 获取当前浏览器窗口的宽高比（aspect ratio）。
     * @returns {number} Aspect ratio (width / height), e.g., returns ~1.777 for 16:9 screen. 宽高比（width / height），例如 16:9 的屏幕返回 ~1.777。
     */
    getAspect() {
        // 调用 getWidthHeight() 获取窗口的宽度和高度
        const [width, height] = this.getWidthHeight();
        // 计算并返回宽高比（宽度 ÷ 高度）
        return width / height;
    }
    /**
     * 获取当前浏览器窗口的实际宽度和高度（视口尺寸）。
     * @returns {Array<number>} 包含宽度和高度的数组 [width, height]，单位是像素。
     */
    getWidthHeight() {
        // window.innerWidth：浏览器视口的宽度（包括滚动条，单位：px）
        let width = window.innerWidth;
        // window.innerHeight：浏览器视口的高度（包括滚动条，单位：px）
        let height = window.innerHeight;
        // 返回 [width, height] 数组
        return [width, height];
    }
    /**
     * Create the default ground plane.
     * 创建默认地面平面
     *
     * @description
     * Creates a large ground plane mesh that serves as a visual base when no tile layers are present.
     * The ground is positioned at y=0 and centered at the map center.
     * 创建一个大型地面网格，当没有瓦片图层时作为视觉基底。
     * 地面位于 y=0 并以地图中心为中心。
     *
     * @param config Ground configuration 地面配置
     * @returns Ground mesh. 地面网格
     * @internal
     */
    _createDefaultGround(config) {
        const centerWorldPos = this.centerWorldPos;
        const color = config?.color ?? "rgb(45,52,60)";
        const opacity = config?.opacity ?? 1;
        const visible = config?.visible ?? false;
        const material = new MeshStandardMaterial({
            transparent: opacity < 1,
            opacity: opacity,
            color: new Color(color),
            metalness: 0.2,
            roughness: 1.0,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        });
        const geometry = new PlaneGeometry(this._sceneSize * 2, this._sceneSize * 2);
        const mesh = new Mesh(geometry, material);
        mesh.name = "DefaultGround";
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.position.y = -0.1;
        mesh.position.add(centerWorldPos);
        mesh.rotateX(-Math.PI / 2);
        mesh.visible = visible;
        return mesh;
    }
    /**
     * Show the default ground plane.
     * 显示默认地面平面
     *
     * @description
     * Makes the default ground plane visible. This is typically called automatically
     * when no tile layers are present in the map.
     * 使默认地面平面可见。通常在地图中没有瓦片图层时自动调用。
     */
    showDefaultGround() {
        if (this._defaultGround) {
            this._defaultGround.visible = true;
        }
    }
    /**
     * Update the default ground plane position.
     * 更新默认地面平面位置
     *
     * @description
     * Recalculates and updates the ground plane position based on current map center.
     * This should be called after the map's root group transformation is finalized.
     * 根据当前地图中心重新计算并更新地面位置。
     * 应在地图根组变换完成后调用。
     *
     * @internal
     */
    _updateDefaultGroundPosition() {
        if (!this._defaultGround || !this.map) {
            return;
        }
        // Recalculate centerWorldPos with the properly transformed rootGroup
        // 使用正确变换后的 rootGroup 重新计算 centerWorldPos
        const newCenterWorldPos = this.map.lngLatToWorld(new Vector3(this.map.center[0], this.map.center[1], 0));
        this.centerWorldPos = newCenterWorldPos;
        // Reset ground position
        // 重置地面位置
        this._defaultGround.position.copy(newCenterWorldPos);
        this._defaultGround.position.y -= 0.1;
    }
    /**
     * Hide the default ground plane.
     * 隐藏默认地面平面
     *
     * @description
     * Hides the default ground plane. This is typically called automatically
     * when tile layers are added to the map.
     * 隐藏默认地面平面。通常在向地图添加瓦片图层时自动调用。
     */
    hideDefaultGround() {
        if (this._defaultGround) {
            this._defaultGround.visible = false;
        }
    }
    /**
     * Check if the default ground plane is visible.
     * 检查默认地面平面是否可见
     *
     * @returns Whether the ground is visible. 地面是否可见
     */
    isDefaultGroundVisible() {
        return this._defaultGround?.visible ?? false;
    }
    /**
     * Set the default ground plane visibility.
     * 设置默认地面平面可见性
     *
     * @param visible Whether the ground is visible. 地面是否可见
     */
    setDefaultGroundVisible(visible) {
        if (this._defaultGround) {
            this._defaultGround.visible = visible;
        }
    }
    /**
     * Set the default ground plane style.
     * 设置默认地面平面样式
     *
     * @param style Style properties. 样式属性
     */
    setDefaultGroundStyle(style) {
        if (!this._defaultGround)
            return;
        const material = this._defaultGround.material;
        if (style.color !== undefined) {
            material.color.set(style.color);
        }
        if (style.opacity !== undefined) {
            material.opacity = style.opacity;
            material.transparent = style.opacity < 1;
        }
    }
    /**
     * 销毁sceneRenderer实例，释放所有资源
     * @description
     * 该方法会清理以下资源：
     * 1. 停止动画循环
     * 2. 销毁控制器
     * 3. 清理场景中的所有对象
     * 4. 销毁渲染器
     * 5. 销毁后期处理器
     * 6. 移除DOM元素
     */
    destroy() {
        // console.log('🗑️ 开始销毁SceneRenderer实例...');
        try {
            // 1. 停止动画循环
            this.renderer.setAnimationLoop(null);
            // console.log('✅ 动画循环已停止');
            // 2. 清理动画回调
            this._animationCallbacks.clear();
            // console.log('✅ 动画回调已清理');
            // 3. 断开map引用，避免控制器事件触发map方法
            // @ts-ignore
            this.map = null;
            // console.log('✅ Map引用已断开');
            // 4. 销毁控制器
            if (this.controls) {
                this.controls.dispose();
                // console.log('✅ 控制器已销毁');
            }
            // 5. 清理场景中的所有对象
            if (this.scene) {
                this.scene.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach((material) => {
                                this._disposeMaterial(material);
                            });
                        }
                        else {
                            this._disposeMaterial(object.material);
                        }
                    }
                });
                this.scene.clear();
                // console.log('✅ 场景已清理');
            }
            // 6. 销毁后期处理器
            if (this.composer) {
                if (this.bloomPass) {
                    this.bloomPass.dispose?.();
                }
                if (this.renderPass) {
                    this.renderPass.dispose?.();
                }
                // @ts-ignore
                this.composer = null;
                // @ts-ignore
                this.renderPass = null;
                // @ts-ignore
                this.bloomPass = null;
                // console.log('✅ 后期处理器已销毁');
            }
            // 7. 销毁渲染器
            if (this.renderer) {
                this.renderer.dispose();
                if (this.container &&
                    this.renderer.domElement.parentNode === this.container) {
                    this.container.removeChild(this.renderer.domElement);
                }
                // console.log('✅ 渲染器已销毁');
            }
            // 8. 清理stats
            if (this.stats && this.stats.dom.parentNode) {
                this.stats.dom.parentNode.removeChild(this.stats.dom);
                // console.log('✅ Stats已移除');
            }
            // console.log('✅ SceneRenderer实例销毁完成');
        }
        catch (error) {
            console.error("❌ 销毁SceneRenderer时出错:", error);
        }
    }
    /**
     * Dispose material resources
     * 销毁材质资源
     * @param material Material to dispose 要销毁的材质
     */
    _disposeMaterial(material) {
        if (!material)
            return;
        // 销毁材质的所有纹理
        const textures = [
            "map",
            "lightMap",
            "bumpMap",
            "normalMap",
            "specularMap",
            "envMap",
            "alphaMap",
            "aoMap",
            "displacementMap",
            "emissiveMap",
            "gradientMap",
            "metalnessMap",
            "roughnessMap",
        ];
        textures.forEach((texName) => {
            if (material[texName]) {
                material[texName].dispose();
            }
        });
        material.dispose();
    }
}
