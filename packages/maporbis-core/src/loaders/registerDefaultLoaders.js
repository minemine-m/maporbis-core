import { TileLoaderFactory } from "./TileLoaderFactory";
import { WebImageLoader } from "./WebImageLoader";
import { MapboxRGBLoader } from "./MapboxRGBLoader";
import { ArcGISLercLoader } from "./ArcGISLercLoader";
/**
 * Register default loaders to TileLoaderFactory.
 * 注册默认加载器到 TileLoaderFactory
 */
export function registerDefaultLoaders() {
    // Material Loaders
    TileLoaderFactory.registerMaterialLoader(new WebImageLoader());
    // Geometry Loaders (Terrain)
    TileLoaderFactory.registerGeometryLoader(new MapboxRGBLoader());
    TileLoaderFactory.registerGeometryLoader(new ArcGISLercLoader());
    // Mesh Loaders (Vector Tile)
    // Note: Vector tiles provide both geometry (data) and can be rendered.
    console.log("[TileLoaderFactory] Default loaders registered.");
}
