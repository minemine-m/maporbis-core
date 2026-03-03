import { MeshStandardNodeMaterial } from 'three/webgpu';
/**
 * TileNodeMaterial for WebGPU
 * Uses TSL for custom terrain displacement (Mapbox RGB format)
 */
export declare class TileNodeMaterial extends MeshStandardNodeMaterial {
    constructor(parameters?: any);
}
