import { MeshStandardNodeMaterial } from 'three/webgpu';
import { texture, positionLocal, normalLocal } from 'three/tsl';
/**
 * TileNodeMaterial for WebGPU
 * Uses TSL for custom terrain displacement (Mapbox RGB format)
 */
export class TileNodeMaterial extends MeshStandardNodeMaterial {
    constructor(parameters = {}) {
        super(parameters);
        // If displacement map is present, apply custom logic
        if (parameters.displacementMap) {
            const heightMap = texture(parameters.displacementMap);
            // Mapbox Terrain RGB decoding
            // height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
            // In shader, color values are 0.0-1.0.
            const r = heightMap.r.mul(255.0).mul(65536.0);
            const g = heightMap.g.mul(255.0).mul(256.0);
            const b = heightMap.b.mul(255.0);
            // Calculate height
            const h = r.add(g).add(b).mul(0.1).mul(heightMap.a).sub(10000.0);
            // Apply displacement along normal
            // Scale factor 1000.0 to match original shader
            this.positionNode = positionLocal.add(normalLocal.mul(h.div(1000.0)));
        }
    }
}
