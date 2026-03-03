import { Vector2, Vector3, BufferGeometry, BufferAttribute, Points, PointsMaterial, SpriteMaterial, Sprite, Color, MeshBasicMaterial, Mesh, BackSide, DoubleSide, FrontSide, ShaderMaterial, RepeatWrapping, TextureLoader, Shape, ShapeGeometry, MeshStandardMaterial, CanvasTexture, MathUtils, NearestFilter, LinearMipmapLinearFilter, Texture, NormalBlending, InstancedMesh, CylinderGeometry, AdditiveBlending, Object3D, LinearFilter, SRGBColorSpace, TubeGeometry, CurvePath, LineCurve3, QuadraticBezierCurve3, MeshPhongMaterial, Path, ExtrudeGeometry } from 'three';
import { MeshStandardNodeMaterial, PointsNodeMaterial, MeshPhongNodeMaterial } from 'three/webgpu';
import { texture, uv, vec2, time, normalize, float, color, step, mix, Discard as discard, length, vec4 } from 'three/tsl';
import { Line2, LineMaterial, LineGeometry, Water } from 'three-stdlib';
import { WebGPUCompat } from './WebGPUCompat';
import { Paint } from '../style';
import { Cloud as vanillaCloud } from "@pmndrs/vanilla";
import { normalizeAnchor } from '../types';
// Material cache to reduce overhead
const _iconMaterialCache = new Map();
/**
 * 创建基础点要素
 * @param config 点样式配置
 * @param position 点位置
 * @returns 点要素对象
  * @category Utils
 */
export function _createBasicPoint(config, position) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const isSizeAttenuation = config.sizeAttenuation ?? true;
    // Align with icon/label size scaling (pixelsToUnit = 0.002) when using size attenuation
    const size = isSizeAttenuation ? config.size * 0.002 : config.size;
    let material;
    if (WebGPUCompat.useWebGPU) {
        material = new PointsNodeMaterial({
            size: size,
            color: config.color || 0xffffff,
            sizeAttenuation: isSizeAttenuation,
            depthTest: config.depthTest ?? true,
            depthWrite: config.depthWrite ?? true,
            transparent: true
        });
        // TSL Circle Logic
        const coord = uv().sub(0.5);
        const dist = length(coord);
        discard(dist.greaterThan(0.5));
    }
    else {
        // console.log('createBasicPoint config.sizeAttenuation ', config.sizeAttenuation);
        const m = new PointsMaterial({
            size: size,
            color: config.color || 0xffffff,
            sizeAttenuation: isSizeAttenuation,
            depthTest: config.depthTest ?? true,
            depthWrite: config.depthWrite ?? true,
        });
        // Custom shader to render a circle
        m.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(`#include <clipping_planes_fragment>`, `
            #include <clipping_planes_fragment>
            vec2 coord = gl_PointCoord - vec2(0.5);
            if(length(coord) > 0.5) discard;
            `);
        };
        material = m;
    }
    const points = new Points(geometry, material);
    points.position.copy(position);
    return points;
}
/**
 * 创建图标点要素
 * @param config 图标样式配置
 * @param position 点位置
 * @returns Promise<Sprite> 图标精灵对象
 */
export async function _createIconPoint(config, position) {
    const cacheKey = JSON.stringify(config);
    let materialPromise = _iconMaterialCache.get(cacheKey);
    if (!materialPromise) {
        materialPromise = (async () => {
            // 尝试加载纹理，但不让异常向外抛出
            let texture = null;
            try {
                texture = await Paint._loadTexture(config.url);
                texture.magFilter = LinearFilter;
                texture.minFilter = LinearMipmapLinearFilter;
                texture.colorSpace = SRGBColorSpace;
                texture.generateMipmaps = true;
                // texture.format = RGBAFormat;
                texture.premultiplyAlpha = false; // 明确设置
                texture.needsUpdate = true;
            }
            catch (error) {
                console.error("IconPoint texture load failed:", config.url, error);
            }
            return new SpriteMaterial({
                // 如果纹理加载失败，map 为 null，使用纯色占位
                map: texture ?? null,
                color: config.color || 0xffffff,
                transparent: config.transparent ?? true,
                opacity: config.opacity ?? 1,
                sizeAttenuation: config.sizeAttenuation ?? true,
                depthTest: config.depthTest ?? true,
                depthWrite: config.depthWrite ?? true,
                alphaTest: config.alphaTest ?? 0.05,
                premultipliedAlpha: false, // 与纹理设置保持一致
                blending: NormalBlending, // 正常混合模式
            });
        })();
        _iconMaterialCache.set(cacheKey, materialPromise);
    }
    const material = await materialPromise;
    const sprite = new Sprite(material);
    const texture = material.map;
    const pixelsToUnit = 0.002;
    // 兼容 size 传数组或单值（虽然类型定义是 [number, number]）
    const rawSize = config.size;
    let width;
    let height;
    if (Array.isArray(rawSize)) {
        // 显式传入 [width, height]，按用户指定来（和以前一致）
        [width, height] = rawSize;
    }
    else {
        // 单值：按“高度像素”理解，宽度按纹理实际比例推导
        const baseSize = (typeof rawSize === 'number' ? rawSize : 32);
        if (texture && texture.image?.width && texture.image?.height) {
            const img = texture.image;
            const aspect = img.width / img.height || 1;
            height = baseSize;
            width = baseSize * aspect;
        }
        else {
            // 没有纹理或取不到尺寸时退回正方形
            width = baseSize;
            height = baseSize;
        }
    }
    sprite.scale.set(width * pixelsToUnit, height * pixelsToUnit, 1);
    if (config.rotation)
        sprite.rotation.z = config.rotation;
    // Normalize anchor to support both named and numeric formats
    if (config.anchor) {
        const normalizedAnchor = normalizeAnchor(config.anchor);
        sprite.center.set(normalizedAnchor[0], normalizedAnchor[1]);
    }
    sprite.position.copy(position);
    // Set renderOrder to ensure marker renders above tiles
    sprite.renderOrder = 99;
    return sprite;
}
// 
/**
 * 创建基础线要素
 * @param config 线样式配置
 * @param positions 顶点坐标数组
 * @returns 线要素对象
  * @category Utils
 */
export function _createBasicLine(config, positions) {
    // 统一坐标数组格式
    let flatPositions;
    if (positions instanceof Float32Array) {
        flatPositions = Array.from(positions);
    }
    else if (Array.isArray(positions) && typeof positions[0] === 'number') {
        flatPositions = positions;
    }
    else {
        flatPositions = positions.flatMap(v => [v.x, v.y, v.z]);
    }
    // console.log('flatPositions', flatPositions);
    // 创建线几何体
    const geometry = new LineGeometry();
    geometry.setPositions(flatPositions);
    // 创建线材质
    const material = new LineMaterial({
        color: new Color(config.color ?? 0xffffff).getHex(),
        linewidth: config.width ?? 2,
        transparent: config.transparent ?? true,
        opacity: config.opacity ?? 1,
        dashed: !!config.dashArray,
        dashScale: 1,
        dashSize: config.dashArray?.[0] ?? 1,
        gapSize: config.dashArray?.[1] ?? 0,
        // 使用物理像素初始化分辨率
        resolution: new Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio),
        alphaToCoverage: false, // 关闭 alphaToCoverage 以避免虚线边缘闪烁
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
        polygonOffset: true, // 开启多边形偏移，防止与地面 Z-fighting
        polygonOffsetFactor: -2, // 将线向相机方向偏移
        polygonOffsetUnits: -2
    });
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    // 动态更新分辨率，解决地图旋转/缩放时虚线流动或线宽异常的问题
    line.onBeforeRender = function (renderer) {
        const drawingBufferSize = new Vector2();
        renderer.getDrawingBufferSize(drawingBufferSize);
        if (material.resolution.x !== drawingBufferSize.x || material.resolution.y !== drawingBufferSize.y) {
            material.resolution.copy(drawingBufferSize);
        }
    };
    return line;
}
/**
 * 创建流动管线
 * @param config 流动管线样式配置
 * @param positions 顶点坐标数组
 * @returns 管线网格
  * @category Utils
 */
export function _createFlowLine(config, positions) {
    // 统一坐标数组格式
    let points = [];
    if (Array.isArray(positions) && typeof positions[0] === 'number') {
        for (let i = 0; i < positions.length; i += 3) {
            points.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }
    }
    else if (positions instanceof Float32Array) {
        for (let i = 0; i < positions.length; i += 3) {
            points.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }
    }
    else {
        points = positions;
    }
    if (points.length < 2)
        return new Mesh();
    // 创建路径 (带圆角)
    const curve = new CurvePath();
    const cornerRadius = config.cornerRadius || 5;
    if (points.length === 2 || cornerRadius <= 0) {
        // 只有两点或不需要圆角，直接用直线
        for (let i = 0; i < points.length - 1; i++) {
            const lineCurve = new LineCurve3(points[i], points[i + 1]);
            curve.curves.push(lineCurve);
        }
    }
    else {
        // 处理圆角逻辑
        let currentPoint = points[0];
        for (let i = 1; i < points.length - 1; i++) {
            const p1 = currentPoint;
            const p2 = points[i];
            const p3 = points[i + 1];
            const v1 = new Vector3().subVectors(p2, p1);
            const v2 = new Vector3().subVectors(p3, p2);
            const len1 = v1.length();
            const len2 = v2.length();
            const maxRadius = Math.min(len1, len2) * 0.4;
            const radius = Math.min(cornerRadius, maxRadius);
            v1.normalize().multiplyScalar(len1 - radius);
            v2.normalize().multiplyScalar(radius);
            const startTangent = new Vector3().addVectors(p1, v1);
            const endTangent = new Vector3().addVectors(p2, v2);
            curve.curves.push(new LineCurve3(p1, startTangent));
            curve.curves.push(new QuadraticBezierCurve3(startTangent, p2, endTangent));
            currentPoint = endTangent;
        }
        curve.curves.push(new LineCurve3(currentPoint, points[points.length - 1]));
    }
    // 创建几何体
    const radius = config.radius || 2;
    const radialSegments = config.radialSegments || 8;
    const tubularSegments = config.tubularSegments || 64;
    const geometry = new TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    // 专门给 bloom 提亮的倍数
    const bloomBoost = 5.0;
    let mesh;
    if (WebGPUCompat.useWebGPU) {
        const material = new MeshPhongNodeMaterial({
            color: config.color || '#19bbd5',
            side: DoubleSide,
            emissive: new Color(config.color || '#19bbd5'),
            emissiveIntensity: 0.6 * bloomBoost,
            transparent: true,
        });
        const totalLength = float(curve.getLength());
        const stripeWidth = float(config.stripeWidth || 10);
        const stripeSpacing = float(config.stripeSpacing || 20);
        const stripeColorNode = color(new Color(config.stripeColor || '#096be3'));
        const speedFactor = float(config.speed || 10);
        // Calculate offset: offset -= delta * normalizedSpeed
        // normalizedSpeed = speedFactor / totalLength * 10
        // Total offset over time = -time * speedFactor / totalLength * 10
        const offset = time.mul(speedFactor).div(totalLength).mul(10).negate();
        // Pattern logic
        const pattern = uv().x.add(offset).mul(totalLength).div(stripeWidth.add(stripeSpacing)).mod(1.0);
        const isStripe = step(pattern, stripeWidth.div(stripeWidth.add(stripeSpacing)));
        // Mix diffuse color
        const baseColor = color(new Color(config.color || '#19bbd5'));
        material.colorNode = mix(baseColor, stripeColorNode, isStripe);
        // Emissive logic
        const extraEmissive = stripeColorNode.mul(isStripe).mul(3.0 * bloomBoost);
        const baseEmissive = color(new Color(config.color || '#19bbd5')).mul(0.6 * bloomBoost);
        // @ts-ignore
        material.emissiveNode = baseEmissive.add(extraEmissive);
        mesh = new Mesh(geometry, material);
    }
    else {
        // 创建材质 - 使用 MeshPhongMaterial 支持发光
        const material = new MeshPhongMaterial({
            color: config.color || '#19bbd5',
            side: DoubleSide,
            emissive: new Color(config.color || '#19bbd5'),
            emissiveIntensity: 0.6 * bloomBoost,
            transparent: true,
        });
        material.defines = { 'USE_UV': '' };
        const length = curve.getLength();
        const uniforms = {
            totalLength: { value: length },
            stripeOffset: { value: 0 },
            stripeWidth: { value: config.stripeWidth || 10 },
            stripeSpacing: { value: config.stripeSpacing || 20 },
            stripeColor: { value: new Color(config.stripeColor || '#096be3') },
            speedFactor: { value: config.speed || 10 },
            bloomBoost: { value: bloomBoost },
        };
        material.onBeforeCompile = shader => {
            shader.uniforms.totalLength = uniforms.totalLength;
            shader.uniforms.stripeOffset = uniforms.stripeOffset;
            shader.uniforms.stripeWidth = uniforms.stripeWidth;
            shader.uniforms.stripeSpacing = uniforms.stripeSpacing;
            shader.uniforms.stripeColor = uniforms.stripeColor;
            shader.uniforms.bloomBoost = uniforms.bloomBoost;
            shader.fragmentShader = `
            uniform float totalLength;
            uniform float stripeOffset;
            uniform float stripeWidth;
            uniform float stripeSpacing;
            uniform vec3 stripeColor;
            uniform float bloomBoost;
            ${shader.fragmentShader}
        `.replace(`#include <color_fragment>`, `#include <color_fragment>
            // 计算条纹模式（用于漫反射）
            float pattern = mod((vUv.x - stripeOffset) * totalLength / (stripeWidth + stripeSpacing), 1.0);
            float isStripe = step(pattern, stripeWidth / (stripeWidth + stripeSpacing));
            
            // 混合条纹颜色
            diffuseColor.rgb = mix(diffuseColor.rgb, stripeColor, isStripe);
            
            // 条纹区域再额外提亮，让 bloom 更明显
            if (isStripe > 0.5) {
                diffuseColor.rgb += stripeColor * (3.0 * bloomBoost);
            }
            `).replace(`#include <emissivemap_fragment>`, `#include <emissivemap_fragment>
            // 计算条纹模式（用于自发光）
            float pattern_e = mod((vUv.x - stripeOffset) * totalLength / (stripeWidth + stripeSpacing), 1.0);
            float isStripe_e = step(pattern_e, stripeWidth / (stripeWidth + stripeSpacing));
            
            // 自发光通道也叠加一遍，进一步抬高亮度
            totalEmissiveRadiance += stripeColor * isStripe_e * (3.0 * bloomBoost);
            `);
        };
        mesh = new Mesh(geometry, material);
        // 动画更新
        let lastTime = 0;
        mesh.onBeforeRender = () => {
            const time = performance.now();
            const delta = lastTime ? (time - lastTime) / 1000 : 0.016;
            lastTime = time;
            const normalizedSpeed = uniforms.speedFactor.value / uniforms.totalLength.value * 10;
            uniforms.stripeOffset.value -= delta * normalizedSpeed;
            uniforms.stripeOffset.value = uniforms.stripeOffset.value % 1.0;
        };
    }
    return mesh;
}
/**
 * 创建箭头流动线（平面带状）
 * @param config 箭头流动线样式配置
 * @param positions 顶点坐标数组
 * @returns 箭头网格
  * @category Utils
 */
export function _createArrowLine(config, positions) {
    // 统一坐标数组格式
    let points = [];
    if (Array.isArray(positions) && typeof positions[0] === 'number') {
        for (let i = 0; i < positions.length; i += 3) {
            points.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }
    }
    else if (positions instanceof Float32Array) {
        for (let i = 0; i < positions.length; i += 3) {
            points.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }
    }
    else {
        points = positions;
    }
    if (points.length < 2)
        return new Mesh();
    // 创建路径 (带圆角)
    const curve = new CurvePath();
    const cornerRadius = config.cornerRadius || 5;
    if (points.length === 2 || cornerRadius <= 0) {
        for (let i = 0; i < points.length - 1; i++) {
            const lineCurve = new LineCurve3(points[i], points[i + 1]);
            curve.curves.push(lineCurve);
        }
    }
    else {
        let currentPoint = points[0];
        for (let i = 1; i < points.length - 1; i++) {
            const p1 = currentPoint;
            const p2 = points[i];
            const p3 = points[i + 1];
            const v1 = new Vector3().subVectors(p2, p1);
            const v2 = new Vector3().subVectors(p3, p2);
            const len1 = v1.length();
            const len2 = v2.length();
            const maxRadius = Math.min(len1, len2) * 0.4;
            const radius = Math.min(cornerRadius, maxRadius);
            v1.normalize().multiplyScalar(len1 - radius);
            v2.normalize().multiplyScalar(radius);
            const startTangent = new Vector3().addVectors(p1, v1);
            const endTangent = new Vector3().addVectors(p2, v2);
            curve.curves.push(new LineCurve3(p1, startTangent));
            curve.curves.push(new QuadraticBezierCurve3(startTangent, p2, endTangent));
            currentPoint = endTangent;
        }
        curve.curves.push(new LineCurve3(currentPoint, points[points.length - 1]));
    }
    // 创建平面带状几何体
    const width = config.width || 4;
    const segments = 128;
    const pathPoints = curve.getPoints(segments);
    const vertices = [];
    const uvs = [];
    const indices = [];
    let accumulatedLength = 0;
    const totalLength = curve.getLength();
    for (let i = 0; i < pathPoints.length; i++) {
        const point = pathPoints[i];
        // 计算切线方向（在XZ平面上）
        let tangent;
        if (i === 0) {
            tangent = new Vector3().subVectors(pathPoints[1], pathPoints[0]);
        }
        else if (i === pathPoints.length - 1) {
            tangent = new Vector3().subVectors(pathPoints[i], pathPoints[i - 1]);
        }
        else {
            tangent = new Vector3().subVectors(pathPoints[i + 1], pathPoints[i - 1]);
        }
        // 只保留XZ平面的方向
        tangent.y = 0;
        tangent.normalize();
        // 计算垂直方向（XZ平面内旋转90度）
        const perpendicular = new Vector3(-tangent.z, 0, tangent.x);
        // 生成带宽的两个顶点（保持在路径的Y高度）
        const halfWidth = width / 2;
        const left = new Vector3(point.x + perpendicular.x * halfWidth, point.y, point.z + perpendicular.z * halfWidth);
        const right = new Vector3(point.x - perpendicular.x * halfWidth, point.y, point.z - perpendicular.z * halfWidth);
        vertices.push(left.x, left.y, left.z);
        vertices.push(right.x, right.y, right.z);
        // 计算累积长度
        if (i > 0) {
            accumulatedLength += pathPoints[i].distanceTo(pathPoints[i - 1]);
        }
        const u = accumulatedLength / totalLength;
        uvs.push(u, 0);
        uvs.push(u, 1);
        // 生成三角面索引
        if (i < pathPoints.length - 1) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const bloomBoost = 5.0;
    let mesh;
    if (WebGPUCompat.useWebGPU) {
        const material = new MeshPhongNodeMaterial({
            color: config.color || '#0ED5FD',
            side: DoubleSide,
            emissive: new Color(config.color || '#0ED5FD'),
            emissiveIntensity: bloomBoost,
            transparent: true,
        });
        const totalLengthFloat = float(totalLength);
        const arrowLength = float(config.arrowLength || 20);
        const arrowSpacing = float(config.arrowSpacing || 80);
        const arrowColor = color(new Color(config.color || '#0ED5FD'));
        const speedFactor = float(config.speed || 10);
        // Offset logic
        const offset = time.mul(speedFactor).div(totalLengthFloat).mul(10).negate();
        const tpat = arrowLength.add(arrowSpacing);
        const posi = uv().x.add(offset).mul(totalLengthFloat).mod(tpat);
        const inArrow = step(posi, arrowLength);
        const npos = posi.div(arrowLength);
        const centerDist = uv().y.sub(0.5).abs();
        const h0 = step(npos, 0.5);
        const headWidth = npos.mul(3.0); // npos / 0.5 * 1.5 = npos * 3.0
        const shaftWidth = float(0.6);
        const arrowWidth = mix(shaftWidth, headWidth, h0);
        const arrowShape = step(centerDist, arrowWidth.mul(0.5));
        const mask = inArrow.mul(arrowShape).clamp(0.0, 1.0);
        // Set Color and Opacity
        // Use vec4 for color + alpha
        material.colorNode = vec4(arrowColor, mask);
        material.opacityNode = mask;
        // Emissive
        // @ts-ignore
        material.emissiveNode = arrowColor.mul(mask).mul(0.5);
        mesh = new Mesh(geometry, material);
    }
    else {
        // 创建材质
        const material = new MeshPhongMaterial({
            color: config.color || '#0ED5FD',
            side: DoubleSide,
            emissive: new Color(config.color || '#0ED5FD'),
            emissiveIntensity: bloomBoost,
            transparent: true,
        });
        material.defines = { 'USE_UV': '' };
        const uniforms = {
            totalLength: { value: totalLength },
            stripeOffset: { value: 0 },
            arrowLength: { value: config.arrowLength || 20 },
            arrowSpacing: { value: config.arrowSpacing || 80 },
            arrowColor: { value: new Color(config.color || '#0ED5FD') },
            bloomBoost: { value: bloomBoost },
            speedFactor: { value: config.speed || 10 },
        };
        material.onBeforeCompile = shader => {
            shader.uniforms.totalLength = uniforms.totalLength;
            shader.uniforms.stripeOffset = uniforms.stripeOffset;
            shader.uniforms.arrowLength = uniforms.arrowLength;
            shader.uniforms.arrowSpacing = uniforms.arrowSpacing;
            shader.uniforms.arrowColor = uniforms.arrowColor;
            shader.uniforms.bloomBoost = uniforms.bloomBoost;
            shader.fragmentShader = shader.fragmentShader.replace(`uniform vec3 diffuse;`, `uniform vec3 diffuse;
            uniform float totalLength;
            uniform float stripeOffset;
            uniform float arrowLength;
            uniform float arrowSpacing;
            uniform vec3 arrowColor;
            uniform float bloomBoost;`);
            shader.fragmentShader = shader.fragmentShader.replace(`#include <color_fragment>`, `#include <color_fragment>
            {
                float tpat = arrowLength + arrowSpacing;
                float posi = mod((vUv.x - stripeOffset) * totalLength, tpat);
                float inArrow = step(posi, arrowLength);
                float npos = posi / arrowLength;
                
                float centerDist = abs(vUv.y - 0.5);
                
                float h0 = step(npos, 0.5);
                float headWidth = mix(0.0, 1.5, npos / 0.5);
                float shaftWidth = 0.6;
                float arrowWidth = mix(shaftWidth, headWidth, h0);
                float arrowShape = step(centerDist, arrowWidth * 0.5);
                
                float mask = inArrow * arrowShape;
                mask = clamp(mask, 0.0, 1.0);
                
                diffuseColor.rgb = arrowColor;
                diffuseColor.a = mask;
            }`);
            shader.fragmentShader = shader.fragmentShader.replace(`#include <emissivemap_fragment>`, `#include <emissivemap_fragment>
            {
                float tpat2 = arrowLength + arrowSpacing;
                float posi2 = mod((vUv.x - stripeOffset) * totalLength, tpat2);
                float inArrow2 = step(posi2, arrowLength);
                float npos2 = posi2 / arrowLength;
                
                float centerDist2 = abs(vUv.y - 0.5);
                
                float h02 = step(npos2, 0.5);
                float headWidth2 = mix(0.0, 1.5, npos2 / 0.5);
                float shaftWidth2 = 0.6;
                float arrowWidth2 = mix(shaftWidth2, headWidth2, h02);
                float arrowShape2 = step(centerDist2, arrowWidth2 * 0.5);
                
                float mask2 = inArrow2 * arrowShape2;
                mask2 = clamp(mask2, 0.0, 1.0);
                
                totalEmissiveRadiance += arrowColor * mask2 * 0.5;
            }`);
        };
        mesh = new Mesh(geometry, material);
        // 动画更新
        let lastTime = 0;
        mesh.onBeforeRender = () => {
            const time = performance.now();
            const delta = lastTime ? (time - lastTime) / 1000 : 0.016;
            lastTime = time;
            const normalizedSpeed = uniforms.speedFactor.value / uniforms.totalLength.value * 10;
            uniforms.stripeOffset.value -= delta * normalizedSpeed;
            uniforms.stripeOffset.value = uniforms.stripeOffset.value % 1.0;
        };
    }
    return mesh;
}
/**
 * 创建纹理流动线（发光箭头线等）- 修复扭曲问题
 * @param config 纹理流动线样式配置
 * @param positions 顶点坐标数组
 * @returns 线状 Mesh
 */
export async function _createFlowTextureLine(config, positions) {
    // 统一坐标数组格式为 Vector3[] (此部分逻辑不变)
    let points = [];
    if (Array.isArray(positions) && typeof positions[0] === 'number') {
        const arr = positions;
        for (let i = 0; i < arr.length; i += 3) {
            points.push(new Vector3(arr[i], arr[i + 1], arr[i + 2]));
        }
    }
    else if (positions instanceof Float32Array) {
        for (let i = 0; i < positions.length; i += 3) {
            points.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }
    }
    else {
        points = positions;
    }
    if (points.length < 2)
        return new Mesh();
    const halfWidth = (config.width ?? 10) * 0.5;
    const positionsArray = [];
    const uvsArray = [];
    const indices = [];
    // 计算总长度
    let totalLength = 0;
    const segmentLengths = [0];
    for (let i = 1; i < points.length; i++) {
        const segLen = points[i].distanceTo(points[i - 1]);
        totalLength += segLen;
        segmentLengths.push(totalLength);
    }
    if (totalLength === 0)
        return new Mesh();
    const repeat = config.repeat ?? 1;
    // 第一步：计算所有左右顶点的位置（在水平面上）
    const leftPoints = [];
    const rightPoints = [];
    for (let i = 0; i < points.length; i++) {
        // 计算切线方向
        let tangent = new Vector3();
        if (i === 0) {
            tangent.subVectors(points[i + 1], points[i]);
        }
        else if (i === points.length - 1) {
            tangent.subVectors(points[i], points[i - 1]);
        }
        else {
            tangent.subVectors(points[i + 1], points[i - 1]);
        }
        tangent.normalize();
        // 计算垂直于切线的水平方向
        const up = new Vector3(0, 1, 0);
        let normal = new Vector3().crossVectors(tangent, up);
        if (normal.lengthSq() < 1e-10) {
            normal.set(1, 0, 0);
        }
        else {
            normal.normalize();
        }
        // 计算左右顶点位置
        leftPoints.push(points[i].clone().add(normal.clone().multiplyScalar(-halfWidth)));
        rightPoints.push(points[i].clone().add(normal.clone().multiplyScalar(halfWidth)));
    }
    // 第二步：分别计算左右两侧边界的累积长度
    const leftLengths = [0];
    const rightLengths = [0];
    let leftTotalLength = 0;
    let rightTotalLength = 0;
    for (let i = 1; i < leftPoints.length; i++) {
        leftTotalLength += leftPoints[i].distanceTo(leftPoints[i - 1]);
        leftLengths.push(leftTotalLength);
        rightTotalLength += rightPoints[i].distanceTo(rightPoints[i - 1]);
        rightLengths.push(rightTotalLength);
    }
    // 使用左右两侧的平均长度作为基准
    const avgTotalLength = (leftTotalLength + rightTotalLength) / 2;
    if (avgTotalLength === 0)
        return new Mesh();
    // 第三步：生成顶点和UV坐标
    for (let i = 0; i < points.length; i++) {
        positionsArray.push(leftPoints[i].x, leftPoints[i].y, leftPoints[i].z, rightPoints[i].x, rightPoints[i].y, rightPoints[i].z);
        // 关键修复4：使用中心线的累积长度作为U坐标
        // 这是最标准的做法，虽然在急转弯处会有轻微剪切变形
        // 但贴图不会看起来“歪”或扭曲
        const u = (segmentLengths[i] / totalLength) * repeat;
        // V坐标保持0和1，让贴图在宽度方向上完整显示
        uvsArray.push(u, 0, // 左侧顶点：使用中心线U坐标，V=0
        u, 1 // 右侧顶点：使用中心线U坐标，V=1
        );
    }
    // 生成三角形索引（此部分逻辑不变，但依赖于正确的顶点顺序）
    const segmentCount = points.length - 1;
    for (let i = 0; i < segmentCount; i++) {
        const a = i * 2; // 当前段左侧起点
        const b = i * 2 + 1; // 当前段右侧起点
        const c = (i + 1) * 2; // 下一段左侧起点
        const d = (i + 1) * 2 + 1; // 下一段右侧起点
        // 第一个三角形：a → c → b
        indices.push(a, c, b);
        // 第二个三角形：c → d → b
        indices.push(c, d, b);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positionsArray), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvsArray), 2));
    geometry.setIndex(indices);
    // 计算几何体的边界框，确保渲染正确
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    // 加载流动纹理
    const texture = await Paint._loadTexture(config.flowTexture);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    // 关键修复5：设置各向异性过滤，提升纹理显示质量[8](@ref)
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    const color = new Color(config.color ?? 0xffffff);
    const bloomBoost = 5.0;
    const uniforms = {
        uMap: { value: texture },
        uColor: { value: color },
        uOpacity: { value: config.opacity ?? 1 },
        uOffset: { value: 0 },
        uBloomBoost: { value: bloomBoost },
    };
    const depthOffset = config.depthOffset ?? 1;
    const enablePolygonOffset = depthOffset !== 0;
    // 关键修复6：优化着色器代码，确保纹理采样正确
    const material = new ShaderMaterial({
        uniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uMap;
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uOffset;
            uniform float uBloomBoost;
            varying vec2 vUv;

            void main() {
                // 关键修复：修正UV滚动计算，确保方向正确[3](@ref)
                vec2 uv = vec2(fract(vUv.x + uOffset), vUv.y);
                vec4 texColor = texture2D(uMap, uv);
                
                // 添加alpha测试，完全透明的片元直接丢弃
                if (texColor.a < 0.01) discard;
                
                float alpha = texColor.a * uOpacity;
                vec3 baseColor = texColor.rgb * uColor;
                // 使用更自然的颜色增强公式
                vec3 finalColor = baseColor * uBloomBoost;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: config.transparent ?? true,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? false,
        blending: AdditiveBlending,
        side: DoubleSide,
        polygonOffset: enablePolygonOffset,
        polygonOffsetFactor: -depthOffset,
        polygonOffsetUnits: -depthOffset,
    });
    const mesh = new Mesh(geometry, material);
    // 动画更新：沿线滚动UV[1](@ref)
    let lastTime = 0;
    mesh.onBeforeRender = () => {
        const time = performance.now();
        const delta = lastTime ? (time - lastTime) / 1000 : 0.016;
        lastTime = time;
        const speed = config.speed ?? 10;
        // 使用fract函数确保偏移量在0-1范围内，避免精度问题
        uniforms.uOffset.value = fract(uniforms.uOffset.value - delta * speed / totalLength);
    };
    // 辅助函数：确保值在[0,1)范围内
    function fract(x) {
        return x - Math.floor(x);
    }
    return mesh;
}
// ... existing code ...
/**
 * 创建基础多边形
 * @param config 多边形样式配置
 * @param positions 顶点坐标数组
 * @returns 多边形网格
  * @category Utils
 */
export function _createBasePolygon(config, polygons) {
    const { geometry, center, avgY } = _createPolygonGeometry(polygons);
    // 使用样式里的 depthOffset 控制 polygonOffset 强度
    const depthOffset = config.depthOffset ?? 0;
    const enablePolygonOffset = depthOffset !== 0;
    const material = new MeshBasicMaterial({
        color: new Color(config.color ?? 0xffffff),
        transparent: config.transparent ?? true,
        opacity: config.opacity ?? 1,
        wireframe: config.wireframe ?? false,
        side: config.side === 'back' ? BackSide :
            config.side === 'double' ? DoubleSide : FrontSide,
        // depthWrite: true,
        polygonOffset: enablePolygonOffset,
        polygonOffsetFactor: enablePolygonOffset ? depthOffset : 0,
        polygonOffsetUnits: enablePolygonOffset ? depthOffset : 0,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
    });
    const fillMesh = new Mesh(geometry, material);
    // 水面同款：先在 XY 平面生成，再旋转到 XZ 平面
    fillMesh.rotation.x = -Math.PI / 2;
    fillMesh.position.set(center.x, avgY, center.z);
    // === 可选边框线 ===
    const hasBorder = (config.borderWidth ?? 0) > 0;
    if (hasBorder) {
        const borderColor = config.borderColor ?? config.color ?? 0x000000;
        const borderStyle = {
            type: "basic-line",
            color: borderColor,
            width: config.borderWidth,
            // dashArray: config.borderdashArray,
            // opacity: config.opacity
        };
        // Iterate all rings
        polygons.forEach(rings => {
            rings.forEach(ring => {
                const localPositions = [];
                ring.forEach(v => {
                    localPositions.push(v.x - center.x, -(v.z - center.z), 0);
                });
                const borderLine = _createBasicLine(borderStyle, localPositions);
                // 在“平面法线方向”稍微抬一点，避免 z-fighting。
                // 注意：这里的 z 是旋转前的局部 Z，旋转后会变成世界坐标的 Y（高度）
                borderLine.position.z += 0.1;
                fillMesh.add(borderLine);
            });
        });
    }
    return fillMesh;
}
/**
 * 创建拉伸多边形
 * @param config 拉伸样式配置
 * @param flatPositions 平面坐标数组
 * @returns 拉伸多边形网格
  * @category Utils
 */
export function _createExtrudedPolygon(config, polygons) {
    const { shapes, center, avgY } = _createPolygonGeometry(polygons);
    const height = config.extrude?.height || 2000;
    const geometry = new ExtrudeGeometry(shapes, {
        depth: height,
        bevelEnabled: false
    });
    // 创建自定义着色器材质
    // Replace ShaderMaterial with MeshBasicMaterial + onBeforeCompile for WebGPU compatibility
    const material = new MeshBasicMaterial({
        color: config.color ?? 0xffffff,
        transparent: config.transparent ?? true,
        opacity: config.opacity ?? 1,
        side: DoubleSide,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
    });
    // WebGL compatibility: Inject original Shader logic via onBeforeCompile
    material.onBeforeCompile = (shader) => {
        shader.uniforms.uBrightness = { value: 1.2 };
        shader.vertexShader = shader.vertexShader.replace('#include <common>', `
            #include <common>
            varying vec3 vWorldPosition;
            varying vec3 vNormalView;
            `);
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
            #include <begin_vertex>
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vNormalView = normalize(normalMatrix * normal);
            `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
            #include <common>
            uniform float uBrightness;
            varying vec3 vWorldPosition;
            varying vec3 vNormalView;
            `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
            #include <dithering_fragment>
            float fresnel = pow(1.0 - abs(dot(vNormalView, vec3(0.0, 0.0, 1.0))), 2.0);
            float innerGlow = smoothstep(0.3, 0.8, length(vWorldPosition)) * uBrightness;
            gl_FragColor.rgb = gl_FragColor.rgb * (1.0 + fresnel * 0.5 + innerGlow);
            `);
    };
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, avgY, center.z);
    // mesh.renderOrder = 5000;
    return mesh;
}
/**
 * 创建水面效果
 * @param config 水面样式配置
 * @param map 地图实例
 * @param vertices 顶点坐标数组
 * @returns 水面网格
  * @category Utils
 */
export function _createWaterSurface(config, map, polygons) {
    const { geometry, center, avgY } = _createPolygonGeometry(polygons);
    if (WebGPUCompat.useWebGPU) {
        const material = new MeshPhongNodeMaterial({
            color: config.color || '#19AAEE',
            transparent: true,
            opacity: config.opacity || 0.8,
            shininess: 50,
        });
        if (config.normalMap) {
            new TextureLoader().load(config.normalMap, (tex) => {
                tex.wrapS = tex.wrapT = RepeatWrapping;
                material.normalMap = tex;
                material.needsUpdate = true;
            });
        }
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(center.x, avgY, center.z);
        return mesh;
    }
    const water = new Water(geometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load(config.normalMap, function (texture) {
            texture.wrapS = texture.wrapT = RepeatWrapping;
        }),
        waterColor: config.color || '#19AAEE',
        sunColor: config.sunColor || '#05FFF8',
        distortionScale: 1,
        alpha: config.opacity || 0.8,
        // depthTest: config.depthTest ?? true,
        // depthWrite: config.depthWrite ?? true,
    });
    // 设置渲染回调
    const before = water.onBeforeRender;
    const after = water.onAfterRender;
    water.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
        map.autoUpdate = false;
        before.call(water, renderer, scene, camera, geometry, material, group);
    };
    water.onAfterRender = (renderer, scene, camera, geometry, material, group) => {
        map.autoUpdate = true;
        after.call(water, renderer, scene, camera, geometry, material, group);
    };
    water.material.uniforms["size"].value = 0.1;
    water.rotation.x = -Math.PI / 2;
    water.position.set(center.x, avgY, center.z);
    // 添加动画更新
    map.sceneRenderer.addEventListener("update", () => {
        water.material.uniforms["time"].value += 1.0 / 60.0;
    });
    return water;
}
/**
 * Create highlight water surface
 * 创建高亮水面
 * @param config Highlight water paint configuration
 * @param map Map instance
 * @param vertices Vertex coordinates
 * @returns Water mesh
 * @category Utils
 */
export function _createHighlightWater(config, _map, polygons) {
    const { geometry, center, avgY } = _createPolygonGeometry(polygons);
    // 加载法线贴图 
    const textureLoader = new TextureLoader();
    const normalMap = textureLoader.load(config.normalMap);
    normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
    // 开启各向异性过滤 
    normalMap.anisotropy = 16;
    normalMap.repeat.set(0.001, 0.001);
    // 检查是否使用 WebGPU
    const useWebGPU = WebGPUCompat.useWebGPU;
    if (useWebGPU) {
        // WebGPU 路径：使用 NodeMaterial 和 TSL 实现水面流动
        const material = new MeshStandardNodeMaterial({
            color: new Color(config.color).multiplyScalar(2.0), // 提亮 
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: config.opacity || 0.8,
            side: DoubleSide
        });
        // TSL 逻辑实现
        const repeat = vec2(0.001, 0.001);
        const baseUV = uv().mul(repeat);
        // 层1：向一个方向流动
        const uv1 = baseUV.add(vec2(time.mul(0.01), time.mul(0.005)));
        const mapN1 = texture(normalMap, uv1).rgb.mul(2.0).sub(1.0);
        // 层2：向相反/交叉方向流动
        const uv2 = baseUV.add(vec2(time.mul(-0.01), time.mul(0.008)));
        const mapN2 = texture(normalMap, uv2).rgb.mul(2.0).sub(1.0);
        // 混合两层法线
        const mapN = normalize(mapN1.add(mapN2));
        // 应用法线到材质
        material.normalNode = mapN;
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(center.x, avgY, center.z);
        return mesh;
    }
    else {
        // WebGL 路径：使用 onBeforeCompile 注入 Shader
        const material = new MeshStandardMaterial({
            color: new Color(config.color).multiplyScalar(2.0), // 提亮 
            roughness: 0.1,
            metalness: 0.8,
            normalMap: normalMap,
            normalScale: new Vector2(0.8, 0.8),
            envMapIntensity: 1.5,
            transparent: true,
            opacity: config.opacity || 0.8,
            side: DoubleSide
        });
        // 自定义着色器逻辑：双层法线贴图叠加，实现波纹交错流动效果
        const userData = { time: { value: 0 } };
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = userData.time;
            // 注入 uniform 变量（放在 common 之后确保位置正确）
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
                #include <common>
                uniform float uTime;
                `);
            // 替换法线采样逻辑，使用双层采样混合
            shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
                #ifdef USE_NORMALMAP
                    // 层1：向一个方向流动
                    vec2 uv1 = vNormalMapUv + vec2(uTime * 0.01, uTime * 0.005);
                    vec3 mapN1 = texture2D( normalMap, uv1 ).xyz * 2.0 - 1.0;
                    
                    // 层2：向相反/交叉方向流动
                    vec2 uv2 = vNormalMapUv + vec2(-uTime * 0.01, uTime * 0.008);
                    vec3 mapN2 = texture2D( normalMap, uv2 ).xyz * 2.0 - 1.0;
                    
                    // 混合两层法线
                    vec3 mapN = normalize(mapN1 + mapN2);
                    
                    mapN.xy *= normalScale;
                    
                    // Three.js r171+ 使用 tbn 矩阵进行变换
                    #ifdef USE_NORMALMAP_TANGENTSPACE
                        normal = normalize( tbn * mapN );
                    #endif
                #endif
                `);
        };
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(center.x, avgY, center.z);
        // 动画逻辑：只更新时间，纹理偏移交给 shader 处理
        mesh.onBeforeRender = () => {
            userData.time.value = performance.now() * 0.001;
        };
        return mesh;
    }
}
/**
 * 计算ring的有向面积（用于判断顺时针/逆时针方向）
 * 使用Shoelace公式：area = Σ(x_i * z_{i+1} - x_{i+1} * z_i) / 2
 * 负面积表示逆时针（CCW），正面积表示顺时针（CW）
 */
function calculateSignedArea(ring) {
    if (ring.length < 3)
        return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const v1 = ring[i];
        const v2 = ring[i + 1];
        area += (v2.x - v1.x) * (v2.z + v1.z);
    }
    return area / 2;
}
/**
 * 反向ring的顶点顺序
 */
function reverseRing(ring) {
    return ring.slice().reverse();
}
/**
 * 创建多边形几何体
 * @param vertices 顶点坐标数组
 * @returns 几何体及相关数据
  * @category Utils
 */
export function _createPolygonGeometry(polygons) {
    // Calculate center and average Y
    let avgY = 0;
    let count = 0;
    const center = { x: 0, z: 0 };
    polygons.forEach(rings => {
        rings.forEach(ring => {
            ring.forEach(v => {
                avgY += v.y;
                center.x += v.x;
                center.z += v.z;
                count++;
            });
        });
    });
    if (count > 0) {
        avgY /= count;
        center.x /= count;
        center.z /= count;
    }
    const shapes = [];
    polygons.forEach((rings, polyIdx) => {
        if (rings.length === 0)
            return;
        // 验证和处理外环
        let outerRing = rings[0];
        // 检查ring有效性
        if (outerRing.length < 3) {
            console.warn(`[POLYGON-WARN] Polygon ${polyIdx}: outer ring has insufficient points (${outerRing.length})`);
            return;
        }
        // 检查首尾点是否相同，如果不同则添加首点到末尾
        const firstPoint = outerRing[0];
        const lastPoint = outerRing[outerRing.length - 1];
        if (firstPoint.distanceTo(lastPoint) > 0.0001) {
            outerRing = [...outerRing, firstPoint.clone()];
        }
        // 检测外环方向
        const outerArea = calculateSignedArea(outerRing);
        const isOuterCCW = outerArea < 0; // 逆时针为负
        // Three.js ShapeGeometry期望外环为逆时针（CCW）
        if (!isOuterCCW) {
            outerRing = reverseRing(outerRing);
        }
        // 转换外环坐标
        const outerPoints = outerRing.map(v => new Vector2(v.x - center.x, -(v.z - center.z)));
        const shape = new Shape(outerPoints);
        // 处理孔洞（内环）
        for (let i = 1; i < rings.length; i++) {
            let holeRing = rings[i];
            // 检查ring有效性
            if (holeRing.length < 3) {
                console.warn(`[POLYGON-WARN] Polygon ${polyIdx}, Hole ${i}: insufficient points (${holeRing.length})`);
                continue;
            }
            // 检查首尾点是否相同
            const holeFirst = holeRing[0];
            const holeLast = holeRing[holeRing.length - 1];
            if (holeFirst.distanceTo(holeLast) > 0.0001) {
                holeRing = [...holeRing, holeFirst.clone()];
            }
            // 检测孔洞方向
            const holeArea = calculateSignedArea(holeRing);
            const isHoleCCW = holeArea < 0;
            // 孔洞应该与外环方向相反
            // 如果孔洞是逆时针（与外环相同），需要反向
            if (isHoleCCW === isOuterCCW) {
                holeRing = reverseRing(holeRing);
            }
            // 转换孔洞坐标
            const holePoints = holeRing.map(v => new Vector2(v.x - center.x, -(v.z - center.z)));
            const holePath = new Path(holePoints);
            shape.holes.push(holePath);
        }
        shapes.push(shape);
    });
    const geometry = new ShapeGeometry(shapes);
    return {
        geometry,
        center,
        avgY,
        shapes
    };
}
/**
 * 创建基础水面
 * @param config 水面样式配置
 * @param vertices 顶点坐标数组
 * @returns Promise<Mesh> 水面网格
 */
export async function _createBaseWaterSurface(config, polygons) {
    const { geometry, center, avgY } = _createPolygonGeometry(polygons);
    // 加载多层法线贴图
    const normalMap1 = await Paint._loadTexture(config.normalMap);
    const normalMap2 = await Paint._loadTexture(config.normalMap); // 可以用不同的法线贴图
    normalMap1.wrapS = normalMap1.wrapT = RepeatWrapping;
    normalMap2.wrapS = normalMap2.wrapT = RepeatWrapping;
    // 不同尺度的波纹
    normalMap1.repeat.set(0.015, 0.015); // 大波纹
    normalMap2.repeat.set(0.005, 0.005); // 小波纹
    // 创建材质
    const waterMaterial = new MeshStandardMaterial({
        color: new Color(config.color).multiplyScalar(3.5),
        roughness: 0.1, // 稍微增加粗糙度更真实
        metalness: 0.8,
        transparent: config.transparent ?? true,
        opacity: 0.9,
        fog: false,
        normalMap: normalMap1,
        normalScale: new Vector2(1.5, 1.5),
        // environmentMap: sceneRenderer.scene.environment, 
        envMapIntensity: 2.0, // 提高环境贴图的强度，让反射更亮
        // clearcoat: 1.0,        // 启用 Clearcoat，强度 1.0
        // clearcoatRoughness: 0.0, // Clearcoat 粗糙度 0.0，实现锋利高光
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
    });
    const water = new Mesh(geometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(center.x, avgY + 0.15, center.z);
    water.castShadow = false;
    water.receiveShadow = true;
    let lastTime = 0;
    water.onBeforeRender = () => {
        const time = performance.now();
        const delta = lastTime ? (time - lastTime) / 1000 : 0.016;
        // 第一层：慢速大波纹
        normalMap1.offset.x += delta * 0.08;
        normalMap1.offset.y += delta * 0.03;
        // 第二层：快速小波纹
        normalMap2.offset.x -= delta * 0.12;
        normalMap2.offset.y += delta * 0.02;
        // 轻微的高度波动（模拟水面起伏）
        water.position.y = avgY + 0.5 + Math.sin(time * 0.02) * 0.02;
        lastTime = time;
    };
    return water;
}
// 简单的噪声函数
// @ts-ignore
function noise(x) {
    return Math.sin(x) * 0.5 + Math.sin(x * 2.3) * 0.25 + Math.sin(x * 5.7) * 0.125;
}
/**
 * 创建云朵效果
 * @param config 云朵样式配置
 * @param position 云朵位置
 * @returns 云朵对象
  * @category Utils
 */
export function _createClouds(config, position) {
    config.color = new Color(config.hexcolor);
    if (config.boundstext) {
        config.bounds = new Vector3(config.boundstext.x, config.boundstext.y, config.boundstext.z);
    }
    const cloud = new vanillaCloud(config);
    cloud.castShadow = true;
    cloud.scale.setScalar(50);
    cloud.position.copy(position);
    return cloud;
}
/**
 * 创建文本精灵
 * @param config 文本样式配置
 * @param position 文本位置
 * @returns Promise<Sprite> 文本精灵
 */
export async function _createTextSprite(config, position) {
    // 默认配置
    const textStyleConfig = {
        fontSizeDpi: 48,
        fontFamily: "'Microsoft YaHei', sans-serif",
        fontWeight: 'bold',
        fontStyle: 'normal',
        textColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        showBackground: true,
        bgStyle: 1,
        bgColor: '#3498db',
        bgOpacity: 0.8,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        roundRectRadius: 20,
        bubblePointerHeight: 10,
        bubblePointerWidth: 15,
        bubbleBorderColor: '#ffffff',
        bubbleBorderWidth: 3,
        // 和 canvas-label-fixed 对齐的“屏幕尺寸”参数，fixedSize 作为兼容别名
        screenSpaceSize: 20,
        fixedSize: 50,
    };
    // 合并配置
    const finalConfig = { ...textStyleConfig, ...config };
    // 优先使用 screenSpaceSize，如果只传了 fixedSize，则映射到 screenSpaceSize
    if (finalConfig.screenSpaceSize == null && finalConfig.fixedSize != null) {
        finalConfig.screenSpaceSize = finalConfig.fixedSize;
    }
    // 和 _createFixedSizeTextSprite 一样的规则：
    // 如果调用方显式给了 screenSpaceSize/fixedSize，但没给 fontSizeDpi，
    // 就按 screenSpaceSize * (dpr * 4) 推导 fontSizeDpi（过采样保证清晰）
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const oversample = dpr * 4;
    const hasExplicitSizeParam = config.screenSpaceSize != null || config.fixedSize != null;
    if (config.fontSizeDpi == null && hasExplicitSizeParam) {
        const baseSize = config.screenSpaceSize ??
            config.fixedSize ??
            finalConfig.screenSpaceSize;
        finalConfig.fontSizeDpi = baseSize * oversample;
    }
    // Clamp 一下，避免极端值
    finalConfig.fontSizeDpi = Math.min(Math.max(finalConfig.fontSizeDpi, 8), 128);
    // 创建Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('canvas context is null');
    // 设置字体和计算尺寸
    const fontString = `${finalConfig.fontStyle} ${finalConfig.fontWeight} ${finalConfig.fontSizeDpi}px ${finalConfig.fontFamily}`;
    ctx.font = fontString;
    const padding = finalConfig.showBackground ? 20 : 0;
    const minWidth = 100;
    const minHeight = 50;
    const textMetrics = ctx.measureText(finalConfig.text);
    const textWidth = Math.max(minWidth, textMetrics.width + padding * 2);
    const textHeight = Math.max(minHeight, finalConfig.fontSizeDpi * 1.5 + padding * 2);
    canvas.width = Math.min(textWidth, 2048);
    canvas.height = Math.min(textHeight, 2048);
    // 重新设置上下文
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontString;
    // 绘制背景（如果启用）
    if (finalConfig.showBackground) {
        if (finalConfig.bgStyle === 1) {
            // 圆角矩形背景
            ctx.fillStyle = finalConfig.bgColor;
            ctx.globalAlpha = finalConfig.bgOpacity;
            ctx.beginPath();
            roundRect(ctx, padding / 2, padding / 2, canvas.width - padding, canvas.height - padding, finalConfig.roundRectRadius);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            // 阴影效果
            ctx.shadowColor = finalConfig.shadowColor;
            ctx.shadowBlur = finalConfig.shadowBlur;
            ctx.shadowOffsetX = finalConfig.shadowOffsetX;
            ctx.shadowOffsetY = finalConfig.shadowOffsetY;
        }
        else {
            // 气泡背景
            ctx.fillStyle = finalConfig.bgColor;
            ctx.globalAlpha = finalConfig.bgOpacity;
            ctx.beginPath();
            drawSpeechBubble(ctx, canvas.width / 2, canvas.height / 2, canvas.width * 0.8, canvas.height * 0.8, finalConfig.roundRectRadius, finalConfig.bubblePointerHeight, finalConfig.bubblePointerWidth);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            // 气泡边框
            ctx.strokeStyle = finalConfig.bubbleBorderColor;
            ctx.lineWidth = finalConfig.bubbleBorderWidth;
            ctx.stroke();
        }
    }
    // 绘制文字（带描边）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 先绘制描边
    if (finalConfig.strokeWidth > 0) {
        ctx.strokeStyle = finalConfig.strokeColor;
        ctx.lineWidth = finalConfig.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(finalConfig.text, canvas.width / 2, canvas.height / 2);
    }
    // 再绘制填充文字
    ctx.fillStyle = finalConfig.textColor;
    ctx.fillText(finalConfig.text, canvas.width / 2, canvas.height / 2);
    // 重置阴影
    ctx.shadowColor = 'transparent';
    // 创建sprite
    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.anisotropy = 16;
    const material = new SpriteMaterial({
        map: texture,
        transparent: config.transparent ?? true,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
        alphaTest: config.alphaTest ?? 0.1, // Discard transparent pixels to prevent depth artifacts
        fog: false
    });
    const sprite = new Sprite(material);
    // 设置固定大小：这里也统一用 screenSpaceSize 作为主参数
    const fixedScale = finalConfig.screenSpaceSize ?? finalConfig.fixedSize;
    sprite.scale.set(canvas.width * fixedScale / 100, canvas.height * fixedScale / 100, 1);
    // 处理 anchor 和 textOffset
    // Use normalizeAnchor to support both named and numeric anchor formats
    // 使用 normalizeAnchor 支持命名和数值锚点格式
    const anchor = normalizeAnchor(config.anchor);
    const textOffset = config.textOffset || { x: 0, y: 0 };
    // 计算中心点偏移：textOffset 单位是像素，需要根据 canvas 尺寸转换为 UV 偏移
    sprite.center.set(anchor[0] - textOffset.x / canvas.width, anchor[1] + textOffset.y / canvas.height);
    if (position) {
        sprite.position.copy(position);
    }
    // Set renderOrder to ensure text label renders above tiles
    sprite.renderOrder = 99;
    return sprite;
}
/**
 * 创建固定大小的文本精灵
 * @param config 文本样式配置
 * @param position 文本位置
 * @param map 地图实例
 * @returns Promise<Sprite> 文本精灵
 */
export async function _createFixedSizeTextSprite(config, position, map) {
    // 默认配置
    const defaults = {
        fontSizeDpi: 48,
        fontFamily: "'Microsoft YaHei', sans-serif",
        fontWeight: 'bold',
        fontStyle: 'normal',
        textColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        showBackground: true,
        bgStyle: 1,
        bgColor: '#3498db',
        bgOpacity: 0.8,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        roundRectRadius: 20,
        bubblePointerHeight: 10,
        bubblePointerWidth: 15,
        bubbleBorderColor: '#ffffff',
        bubbleBorderWidth: 3,
        screenSpaceSize: 20,
        maxVisibleDistance: Infinity
    };
    // 合并配置
    const finalConfig = { ...defaults, ...config };
    // 如果只传了 fixedSize，当作 screenSpaceSize 用（参数名统一）
    if (finalConfig.screenSpaceSize == null && config.fixedSize != null) {
        finalConfig.screenSpaceSize = config.fixedSize;
    }
    // 根据 screenSpaceSize 自动推导 fontSize（过采样），
    // 调用方可以完全不传 fontSize，只设一个 screenSpaceSize。
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const oversample = dpr * 4; // 2×DPR 过采样，保证清晰
    if (config.fontSizeDpi == null) {
        finalConfig.fontSizeDpi = finalConfig.screenSpaceSize * oversample;
    }
    // Clamp 一下，避免极端值
    finalConfig.fontSizeDpi = Math.max(finalConfig.fontSizeDpi, 8);
    // 创建Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Failed to get canvas context');
    // 设置字体和计算尺寸
    const fontString = `${finalConfig.fontStyle} ${finalConfig.fontWeight} ${finalConfig.fontSizeDpi}px ${finalConfig.fontFamily}`;
    ctx.font = fontString;
    const padding = finalConfig.showBackground ? 20 : 0;
    const minWidth = 100;
    const minHeight = 50;
    const textMetrics = ctx.measureText(finalConfig.text);
    const textWidth = Math.max(minWidth, textMetrics.width + padding * 2);
    const textHeight = Math.max(minHeight, finalConfig.fontSizeDpi * 1.5 + padding * 2);
    canvas.width = Math.min(textWidth, 2048);
    canvas.height = Math.min(textHeight, 2048);
    // 绘制背景和文字
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontString;
    if (finalConfig.showBackground) {
        if (finalConfig.bgStyle === 1) {
            // 圆角矩形背景
            ctx.fillStyle = finalConfig.bgColor;
            ctx.globalAlpha = finalConfig.bgOpacity;
            ctx.beginPath();
            roundRect(ctx, padding / 2, padding / 2, canvas.width - padding, canvas.height - padding, finalConfig.roundRectRadius);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.shadowColor = finalConfig.shadowColor;
            ctx.shadowBlur = finalConfig.shadowBlur;
            ctx.shadowOffsetX = finalConfig.shadowOffsetX;
            ctx.shadowOffsetY = finalConfig.shadowOffsetY;
        }
        else {
            // 气泡背景
            ctx.fillStyle = finalConfig.bgColor;
            ctx.globalAlpha = finalConfig.bgOpacity;
            ctx.beginPath();
            drawSpeechBubble(ctx, canvas.width / 2, canvas.height / 2, canvas.width * 0.8, canvas.height * 0.8, finalConfig.roundRectRadius, finalConfig.bubblePointerHeight, finalConfig.bubblePointerWidth);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = finalConfig.bubbleBorderColor;
            ctx.lineWidth = finalConfig.bubbleBorderWidth;
            ctx.stroke();
        }
    }
    // 绘制文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (finalConfig.strokeWidth > 0) {
        ctx.strokeStyle = finalConfig.strokeColor;
        ctx.lineWidth = finalConfig.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(finalConfig.text, canvas.width / 2, canvas.height / 2);
    }
    ctx.fillStyle = finalConfig.textColor;
    ctx.fillText(finalConfig.text, canvas.width / 2, canvas.height / 2);
    ctx.shadowColor = 'transparent';
    // 创建Sprite
    const texture = new CanvasTexture(canvas);
    const material = new SpriteMaterial({
        map: texture,
        transparent: config.transparent ?? true,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? true,
        alphaTest: config.alphaTest ?? 0.1, // Discard transparent pixels to prevent depth artifacts
        fog: false
    });
    const sprite = new Sprite(material);
    // 处理 anchor 和 textOffset
    // Use normalizeAnchor to support both named and numeric anchor formats
    // 使用 normalizeAnchor 支持命名和数值锚点格式
    const anchor = normalizeAnchor(config.anchor);
    const textOffset = config.textOffset || { x: 0, y: 0 };
    // canvas-label-fixed 是屏幕空间大小，textOffset 应被视为 CSS 像素
    // canvas.height 对应 screenSpaceSize (CSS像素)
    // 所以 Y 轴偏移比例 = textOffset.y / screenSpaceSize
    // X 轴偏移比例 = textOffset.x / (screenSpaceSize * aspect)
    const cssHeight = finalConfig.screenSpaceSize;
    const cssWidth = cssHeight * (canvas.width / canvas.height);
    sprite.center.set(anchor[0] - textOffset.x / cssWidth, anchor[1] + textOffset.y / cssHeight);
    sprite.position.copy(position);
    // Set renderOrder to ensure text label renders above tiles
    sprite.renderOrder = 99;
    sprite.userData.isLabel = true;
    // 动态更新大小：screenSpaceSize 以“CSS 像素高度”理解
    const updateSize = () => {
        if (!sprite.visible)
            return;
        // 计算相机距离
        const distance = map.sceneRenderer.camera.position.distanceTo(sprite.position);
        // 距离裁剪
        if (distance > finalConfig.maxVisibleDistance) {
            sprite.visible = false;
            return;
        }
        sprite.visible = true;
        // 获取渲染器尺寸（设备像素）
        const size = new Vector2();
        map.sceneRenderer.renderer.getSize(size);
        const viewportHeight = size.height;
        const fovRad = MathUtils.degToRad(map.sceneRenderer.camera.fov);
        const dprLocal = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const targetDevicePixels = finalConfig.screenSpaceSize * dprLocal;
        // worldHeight = targetDevicePixels * 2 * distance * tan(fov/2) / viewportHeight
        const scale = (targetDevicePixels / canvas.height) *
            (2 * distance * Math.tan(fovRad / 2) / viewportHeight);
        sprite.scale.set(scale * canvas.width, scale * canvas.height, 1);
        // 使文字始终面向相机
        sprite.lookAt(map.sceneRenderer.camera.position);
    };
    // 初始化和绑定事件
    updateSize();
    const onBeforeRender = () => updateSize();
    // @ts-ignore
    sprite.addEventListener('dispose', () => {
        map.sceneRenderer.renderer.domElement.removeEventListener('resize', updateSize);
    });
    map.sceneRenderer.renderer.domElement.addEventListener('resize', updateSize);
    // @ts-ignore
    map.sceneRenderer.camera.addEventListener('change', updateSize);
    sprite.onBeforeRender = onBeforeRender;
    return sprite;
}
/**
 * 创建带有图标和文本的Sprite标签
 */
export async function _createIconLabelSprite(options, position) {
    // 1. 在这里统一处理默认值
    // 支持 size 或 iconSize 两种写法，保持和 _createIconPoint 入参习惯一致
    const rawIconSize = options.size ?? options.iconSize;
    const settings = {
        text: options.text || '',
        iconSize: rawIconSize,
        fontSize: options.fontSize ?? 12,
        fontFamily: options.fontFamily || '微软雅黑',
        fontWeight: options.fontWeight ?? 400,
        padding: { top: 3, right: 6, bottom: 3, left: 6, ...options.padding },
        bgColor: options.bgColor || '#ffffff',
        bgOpacity: options.bgOpacity ?? 1,
        textColor: options.textColor || '#000000',
        strokeColor: options.strokeColor || '#000000',
        strokeWidth: options.strokeWidth ?? 0,
        iconScale: options.iconScale ?? 1,
        renderbg: options.renderbg ?? true,
        textOffset: options.textOffset ?? { x: -40, y: -19 },
        depthTest: options.depthTest ?? false,
        depthWrite: options.depthWrite ?? false,
        transparent: options.transparent ?? true,
        canvasScale: 4 // 固定 4 倍采样解决模糊
    };
    //  加载图标
    let iconImage = null;
    if (options.url) {
        try {
            iconImage = await loadImage(options.url);
        }
        catch (e) {
            console.error('Label icon load failed:', options.url);
        }
    }
    // 核心绘图 - 确保 settings 被完整传进去
    const { canvas, width, height, center } = await createLabelCanvas(settings, iconImage);
    // 纹理处理
    const texture = new Texture(canvas);
    texture.generateMipmaps = true; // 生成 Mipmap
    texture.minFilter = LinearMipmapLinearFilter; // 三线性（质量最好）
    texture.magFilter = LinearFilter; // 双线性
    texture.colorSpace = SRGBColorSpace;
    // texture.format = RGBAFormat;
    texture.premultiplyAlpha = false; // 明确设置
    texture.needsUpdate = true;
    // 材质与物体
    const spriteMaterial = new SpriteMaterial({
        map: texture,
        transparent: settings.transparent ?? true,
        depthTest: settings.depthTest ?? true,
        depthWrite: settings.depthWrite ?? true,
        blending: NormalBlending,
        sizeAttenuation: false,
        premultipliedAlpha: false,
        alphaTest: 0.05,
    });
    const sprite = new Sprite(spriteMaterial);
    // 和 _createIconPoint 保持一致的像素→世界单位比例
    const pixelToWorldScale = 0.002;
    sprite.scale.set(width * pixelToWorldScale, height * pixelToWorldScale, 1);
    // sprite.center.set(center[0], center[1]);
    // 如果调用方传了 anchor，则覆盖默认锚点；否则用图标中心
    // Normalize anchor to support both named and numeric formats
    if (options.anchor) {
        const normalizedAnchor = normalizeAnchor(options.anchor);
        sprite.center.set(normalizedAnchor[0], normalizedAnchor[1]);
    }
    else {
        sprite.center.set(center[0], center[1]);
    }
    if (position)
        sprite.position.copy(position);
    // Set renderOrder to ensure icon+label sprite renders above tiles
    sprite.renderOrder = 99;
    return sprite;
}
async function createLabelCanvas(settings, iconImage) {
    return new Promise((resolve) => {
        const { text, fontSize, fontFamily, padding, bgColor, textColor, strokeColor, strokeWidth, iconScale, canvasScale, renderbg, textOffset, iconSize, fontWeight, bgOpacity } = settings;
        const hasIcon = iconImage !== null;
        // === 计算图标的逻辑宽高（保持原始比例） ===
        let iconWidth = 0;
        let iconHeight = 0;
        if (hasIcon && iconImage) {
            const imgWidth = (iconImage.naturalWidth || iconImage.width || 1);
            const imgHeight = (iconImage.naturalHeight || iconImage.height || 1);
            const aspect = imgWidth / imgHeight || 1;
            if (Array.isArray(iconSize)) {
                iconWidth = iconSize[0];
                iconHeight = iconSize[1];
            }
            else if (typeof iconSize === 'number') {
                // 单值按“高度像素”理解，宽度按图片比例推导
                iconHeight = iconSize;
                iconWidth = iconSize * aspect;
            }
            else {
                // 未显式指定 iconSize 时，使用原始尺寸（可以视情况再乘一个缩放）
                iconWidth = imgWidth;
                iconHeight = imgHeight;
            }
        }
        else if (Array.isArray(iconSize)) {
            // 没有图标图片但给了尺寸，按尺寸占位
            iconWidth = iconSize[0];
            iconHeight = iconSize[1];
        }
        else if (typeof iconSize === 'number') {
            iconWidth = iconSize;
            iconHeight = iconSize;
        }
        // 创建临时画布测量文本
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
        tempCtx.font = fontStr;
        const textMetrics = measureTextDimensions(tempCtx, text, fontSize);
        const { width: textWidth, ascent: textAscent, descent: textDescent } = textMetrics;
        // 2. 计算布局（文本相对“图标中心”偏移）
        const iconCenterX = hasIcon ? iconWidth / 2 : 0;
        const iconCenterY = hasIcon ? iconHeight / 2 : 0;
        const textX = iconCenterX + textOffset.x;
        const textY = iconCenterY + textOffset.y;
        // 文本背景边界
        const bgMinX = textX - padding.left;
        const bgMaxX = textX + textWidth + padding.right;
        const bgMinY = textY - textAscent - padding.top;
        const bgMaxY = textY + textDescent + padding.bottom;
        // 计算包含图标和文本的总边界
        let minX;
        let minY;
        let maxX;
        let maxY;
        if (hasIcon) {
            minX = Math.min(0, bgMinX);
            minY = Math.min(0, bgMinY);
            maxX = Math.max(iconWidth, bgMaxX);
            maxY = Math.max(iconHeight, bgMaxY);
        }
        else {
            minX = bgMinX;
            minY = bgMinY;
            maxX = bgMaxX;
            maxY = bgMaxY;
        }
        const logicalWidth = Math.ceil(maxX - minX);
        const logicalHeight = Math.ceil(maxY - minY);
        //  创建主画布
        const { canvas, ctx } = createOptimizedCanvas(logicalWidth, logicalHeight, canvasScale);
        // 计算内容起始位置（从画布原点偏移，使内容居中）
        const contentOffsetX = -minX;
        const contentOffsetY = -minY;
        //  绘制图标
        if (hasIcon && iconImage && iconWidth > 0 && iconHeight > 0) {
            const scaledIconWidth = iconWidth * iconScale;
            const scaledIconHeight = iconHeight * iconScale;
            const iconOffsetX = (iconWidth - scaledIconWidth) / 2;
            const iconOffsetY = (iconHeight - scaledIconHeight) / 2;
            const iconX = contentOffsetX + iconOffsetX;
            const iconY = contentOffsetY + iconOffsetY;
            ctx.drawImage(iconImage, iconX, iconY, scaledIconWidth, scaledIconHeight);
        }
        //  绘制文本背景
        const renderTextX = contentOffsetX + textX;
        const renderTextY = contentOffsetY + textY;
        if (renderbg && bgColor && bgColor !== 'transparent') {
            drawTextBackground(ctx, renderTextX, renderTextY, textWidth, textAscent, textDescent, padding, bgColor, bgOpacity);
        }
        // 绘制文本
        ctx.font = fontStr;
        drawText(ctx, text, renderTextX, renderTextY, textColor, strokeWidth, strokeColor);
        // 计算锚点（图标中心相对于画布的比例；无图标时用居中）
        let anchorX;
        let anchorY;
        if (hasIcon && iconWidth > 0 && iconHeight > 0) {
            anchorX = (contentOffsetX + iconCenterX) / logicalWidth;
            anchorY = (contentOffsetY + iconCenterY) / logicalHeight;
        }
        else {
            anchorX = 0.5;
            anchorY = 0.5;
        }
        resolve({
            canvas,
            width: logicalWidth,
            height: logicalHeight,
            center: [anchorX, 1 - anchorY] // 转换为 canvas 坐标系
        });
    });
}
/**
 * 绘制圆角矩形
 * @param ctx Canvas上下文
 * @param x 左上角x坐标
 * @param y 左上角y坐标
 * @param width 宽度
 * @param height 高度
 * @param radius 圆角半径
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
/**
 * 绘制气泡
 * @param ctx Canvas上下文
 * @param cx 中心x坐标
 * @param cy 中心y坐标
 * @param width 宽度
 * @param height 高度
 * @param radius 圆角半径
 * @param pointerHeight 指针高度
 * @param pointerWidth 指针宽度
 */
function drawSpeechBubble(ctx, cx, cy, width, height, radius, pointerHeight, pointerWidth) {
    if (width <= 0)
        throw new Error("Width must be positive");
    if (height <= 0)
        throw new Error("Height must be positive");
    if (radius < 0)
        throw new Error("Radius cannot be negative");
    const bubbleWidth = width;
    const bubbleHeight = height;
    const bubbleRadius = Math.min(radius, width / 2, height / 2);
    const pointerHeightValue = pointerHeight ?? 10;
    const pointerWidthValue = pointerWidth ?? 15;
    ctx.beginPath();
    // 开始点：左上角+圆角
    ctx.moveTo(cx - bubbleWidth / 2 + bubbleRadius, cy - bubbleHeight / 2);
    // 顶部线条
    ctx.lineTo(cx + bubbleWidth / 2 - bubbleRadius, cy - bubbleHeight / 2);
    ctx.quadraticCurveTo(cx + bubbleWidth / 2, cy - bubbleHeight / 2, cx + bubbleWidth / 2, cy - bubbleHeight / 2 + bubbleRadius);
    // 右侧线条
    ctx.lineTo(cx + bubbleWidth / 2, cy + bubbleHeight / 2 - bubbleRadius);
    ctx.quadraticCurveTo(cx + bubbleWidth / 2, cy + bubbleHeight / 2, cx + bubbleWidth / 2 - bubbleRadius, cy + bubbleHeight / 2);
    // 底部线条（指针在底部中间）
    ctx.lineTo(cx + pointerWidthValue / 2, cy + bubbleHeight / 2);
    ctx.lineTo(cx, cy + bubbleHeight / 2 + pointerHeightValue);
    ctx.lineTo(cx - pointerWidthValue / 2, cy + bubbleHeight / 2);
    ctx.lineTo(cx - bubbleWidth / 2 + bubbleRadius, cy + bubbleHeight / 2);
    // 左侧线条
    ctx.quadraticCurveTo(cx - bubbleWidth / 2, cy + bubbleHeight / 2, cx - bubbleWidth / 2, cy + bubbleHeight / 2 - bubbleRadius);
    ctx.lineTo(cx - bubbleWidth / 2, cy - bubbleHeight / 2 + bubbleRadius);
    ctx.quadraticCurveTo(cx - bubbleWidth / 2, cy - bubbleHeight / 2, cx - bubbleWidth / 2 + bubbleRadius, cy - bubbleHeight / 2);
    ctx.closePath();
}
// /**
//  * 辅助：绘制圆角矩形
//  */
// function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
//     if (w < 2 * r) r = w / 2;
//     if (h < 2 * r) r = h / 2;
//     ctx.beginPath();
//     ctx.moveTo(x + r, y);
//     ctx.arcTo(x + w, y, x + w, y + h, r);
//     ctx.arcTo(x + w, y + h, x, y + h, r);
//     ctx.arcTo(x, y + h, x, y, r);
//     ctx.arcTo(x, y, x + w, y, r);
//     ctx.closePath();
//     ctx.fill();
// }
// 工具函数：创建并配置画布
function createOptimizedCanvas(width, height, scale) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
}
// 工具函数：测量文本尺寸
function measureTextDimensions(ctx, text, fontSize) {
    const metrics = ctx.measureText(text);
    return {
        width: metrics.width,
        ascent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
        descent: metrics.actualBoundingBoxDescent || fontSize * 0.2,
        totalHeight: (metrics.actualBoundingBoxAscent || fontSize * 0.8) +
            (metrics.actualBoundingBoxDescent || fontSize * 0.2)
    };
}
// 工具函数：绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (radius <= 0) {
        ctx.rect(x, y, width, height);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}
// 工具函数：绘制文本背景
function drawTextBackground(ctx, textX, textY, textWidth, textAscent, textDescent, padding, bgColor, bgOpacity = 1) {
    const bgX = textX - padding.left;
    const bgY = textY - textAscent - padding.top;
    const bgWidth = textWidth + padding.left + padding.right;
    const bgHeight = (textAscent + textDescent) + padding.top + padding.bottom;
    ctx.save();
    ctx.globalAlpha = bgOpacity; // 设置全局透明度
    ctx.fillStyle = bgColor;
    drawRoundedRect(ctx, bgX, bgY, bgWidth, bgHeight, 2);
    ctx.fill();
    ctx.restore();
}
// 工具函数：绘制文本
function drawText(ctx, text, x, y, textColor, strokeWidth, strokeColor) {
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    // 先描边
    if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
    }
    // 再填充（只填充一次，双重填充效果不明显且影响性能）
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
    ctx.restore();
}
/**
 * 加载图片
 * @param url 图片URL
 * @returns Promise<HTMLImageElement> 图片元素
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${url} ${e}`));
        img.src = url;
    });
}
// 路灯 points
export async function createLight(config, geometries, map) {
    // const sprite = createSprite({
    //     image: 'light.png',
    //     position: [0, 0],
    //     center: [0.5, 0.5],
    //     scale: [0.001, 0.001, 1],
    // }, map);
    // return sprite;
    const h = 1.5;
    const colGeometry = new CylinderGeometry(0.2, 0.2, h * 16, 12);
    const colMaterial = new MeshBasicMaterial({ color: config.color });
    const texture = await Paint._loadTexture(config.icon);
    // const texture = await map.sceneRenderer.dataLoader.loadTexture("/threescene/resources/img/texture/effects/proceduralcity/lensflare2_alpha.png");
    const material = new PointsMaterial({
        // color: new THREE.Color(color).multiplyScalar(0.5),
        size: (80 * window.innerHeight / window.innerHeight),
        fog: false,
        opacity: 1,
        transparent: config.transparent ?? true,
        toneMapped: false,
        blending: AdditiveBlending,
        map: texture,
        sizeAttenuation: true,
        depthTest: config.depthTest ?? true,
        depthWrite: config.depthWrite ?? false,
    });
    // 生成网格
    const InstancedCol = new InstancedMesh(colGeometry, colMaterial, geometries.length);
    InstancedCol.position.add(map.prjcenter);
    InstancedCol.castShadow = true;
    // InstancedCol.renderOrder = 1;
    const transform = new Object3D();
    const positionsData = [];
    for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i];
        // const coordinates = geometry.coordinates;
        // let xy4326 = { x: coordinates[0], y: coordinates[1], z: 0 };
        const coordinates = new Vector3(geometry.coordinates[0], geometry.coordinates[1], geometry.coordinates[2] || 0 // 默认高度0
        );
        // if (xy4326.x > 10000) xy4326 = epsg3857To4326(...coordinates);
        const xy1 = map.lngLatToWorld(coordinates);
        const xy2 = xy1.sub(map.prjcenter);
        transform.position.copy(xy2);
        transform.updateMatrix();
        InstancedCol.setMatrixAt(i, transform.matrix);
        positionsData.push(xy2.x, 0, xy2.z);
    }
    const positions = new Float32Array(positionsData);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    const points = new Points(geometry, material);
    points.position.add(map.prjcenter);
    points.position.y = h * 10;
    points.renderOrder = 99999999;
    points.visible = true;
    // console.log(map, 'map');
    // map.sceneRenderer.scene.add(points);
    // map.sceneRenderer.scene.add(InstancedCol);
    // this.map._viewchangeFuns.push((dis) => {
    //     points.visible = !!(this.map.camera.position.y < 400);
    //     InstancedCol.visible = !!(this.map.camera.position.y < 400);
    // })
    return {
        points,
        InstancedCol,
    };
}
