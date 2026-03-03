import { MeshStandardMaterial, MeshStandardMaterialParameters, Texture } from "three";
/**
 * Tile material
 */
export declare class TileMaterial extends MeshStandardMaterial {
    constructor(params?: MeshStandardMaterialParameters);
    setTexture(texture: Texture): void;
    dispose(): void;
}
