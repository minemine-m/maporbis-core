/**
 * RGB Encoded Terrain Parser (Mapbox Terrain-RGB)
 * RGB 编码地形解析器
 */
export class RGBParser {
	/**
	 * Parse image data to DEM array
	 * 解析图像数据为 DEM 数组
	 * @param imgData Image data
	 * @returns DEM float array
	 */
	public static parse(imgData: ImageData): Float32Array {
		return RGBParser.getDEMFromImage(imgData.data);
	}

	/**
	 * Convert RGBA data to DEM height
	 * @param imgData 
	 */
	private static getDEMFromImage(imgData: Uint8ClampedArray): Float32Array {
		// RGB to height  (Mapbox Terrain-RGB v1)
		// https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-rgb-v1/
		function getZ(imgData: Uint8ClampedArray, i: number) {
			const index = i * 4;
			const [r, g, b, a] = imgData.slice(index, index + 4);
			// Transparent pixels return 0
			// 透明像素直接返回高度0
			if (a === 0) {
				return 0;
			}
			const h = -10000 + ((r << 16) | (g << 8) | b) * 0.1;
			return h;
		}

		const count = imgData.length >>> 2;
		const dem = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			dem[i] = getZ(imgData, i);
		}
		return dem;
	}
}
