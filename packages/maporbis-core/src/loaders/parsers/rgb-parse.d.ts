/**
 * RGB Encoded Terrain Parser (Mapbox Terrain-RGB)
 * RGB 编码地形解析器
 */
export declare class RGBParser {
    /**
     * Parse image data to DEM array
     * 解析图像数据为 DEM 数组
     * @param imgData Image data
     * @returns DEM float array
     */
    static parse(imgData: ImageData): Float32Array;
    /**
     * Convert RGBA data to DEM height
     * @param imgData
     */
    private static getDEMFromImage;
}
