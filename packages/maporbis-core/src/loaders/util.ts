import { Box2, Vector2 } from "three";
import { ISource } from "../sources";

// ==========================================================
// 接口和常量定义
// ==========================================================

/**
 * GeoJSON 兼容的 WGS84 坐标数组 [Lng, Lat]
 */
type GeoJSONPosition = [number, number];

/**
 * GeoJSON Geometry 的返回类型 (用于 GeoJSON 兼容输出)
 */
interface GeoJSONGeometry {
	type: string;
	coordinates: any; // 嵌套的 [Lng, Lat] 数组
}

// 常量
const TILE_EXTENT = 4096;
const PI = Math.PI;

// ==========================================================
// 瓦片/边界工具函数 (保持不变)
// ==========================================================

/**
 * Get bounds to clip image
 * @param clipBounds bounds [minx,miny,maxx,maxy],0-1
 * @param targetSize size to scale
 * @returns startX,StarY,width,height
 */
export function getBoundsCoord(clipBounds: [number, number, number, number], targetSize: number) {
	// left-top coordinate
	const sx = Math.floor(clipBounds[0] * targetSize);
	const sy = Math.floor(clipBounds[1] * targetSize);
	// width and height of the clipped image
	const sw = Math.floor((clipBounds[2] - clipBounds[0]) * targetSize);
	const sh = Math.floor((clipBounds[3] - clipBounds[1]) * targetSize);
	return { sx, sy, sw, sh };
}

/**
 * Get url and rect for max level tile
 * to load greater than max level from source,  had to load from max level.
 * 因为瓦片数据并未覆盖所有级别瓦片，如MapBox地形瓦片最高只到15级，如果要显示18级以上瓦片，不能从17级瓦片中获取，只能从15级瓦片里截取一部分
 * @param source
 * @param tile
 * @returns max tile url and bounds in  in maxTile
 */
export function getSafeTileUrlAndBounds(
	source: ISource,
	x: number,
	y: number,
	z: number
): {
	url: string | undefined;
	clipBounds: [number, number, number, number];
} {
	// 请求数据级别<最小级别返回空
	if (z < source.minLevel) {
		return {
			url: undefined,
			clipBounds: [0, 0, 1, 1],
		};
	}
	// 请数据级别<最大级别返回图片uil已经全部图片范围
	if (z <= source.maxLevel) {
		const url = source._getUrl(x, y, z);
		// const box = new Box2(new Vector2(-0.5, -0.5), new Vector2(0.5, 0.5));
		const clipBounds: [number, number, number, number] = [0, 0, 1, 1];
		return {
			url,
			clipBounds,
		};
	}

	// 取出数据源最大级别瓦片和当前瓦片在最大瓦片中的位置
	const maxLevelTileAndBox = getMaxLevelTileAndBounds(x, y, z, source.maxLevel);
	const pxyz = maxLevelTileAndBox.parentNO;
	const url = source._getUrl(pxyz.x, pxyz.y, pxyz.z);

	return { url, clipBounds: maxLevelTileAndBox.bounds };
}

function getMaxLevelTileAndBounds(x: number, y: number, z: number, maxLevel: number) {
	const dl = z - maxLevel;
	const parentNO = { x: x >> dl, y: y >> dl, z: z - dl };
	const sep = Math.pow(2, dl);
	const size = Math.pow(0.5, dl);
	const xx = (x % sep) / sep - 0.5 + size / 2;
	const yy = (y % sep) / sep - 0.5 + size / 2;
	const parentCenter = new Vector2(xx, yy);

	const box = new Box2().setFromCenterAndSize(parentCenter, new Vector2(size, size));
	const bounds: [number, number, number, number] = [box.min.x + 0.5, box.min.y + 0.5, box.max.x + 0.5, box.max.y + 0.5];

	return { parentNO, bounds };
}

// ==========================================================
// WGS84 坐标转换函数 (GeoJSON 兼容)
// ==========================================================

/**
 * 将_Vector2格式的瓦片坐标转换为WGS84经纬度
 * @param {Vector2} vector2 - 包含x, y属性的坐标对象 (x: 1536, y: 4176)
 * @param tileX - 瓦片X坐标
 * @param tileY - 瓦片Y坐标 
 * @param zoom - 缩放级别
 * @param extent - 瓦片范围，默认4096
 * @returns GeoJSON 兼容的 WGS84 坐标数组 `[Lng, Lat]`
 */
export function vector2ToWGS84(vector2: Vector2, tileX: number, tileY: number, zoom: number, extent: number = TILE_EXTENT): GeoJSONPosition {
	const { x, y } = vector2;

	// 标准化瓦片坐标到0-1范围 (全球范围)
	const normalizedX = (tileX + x / extent) / Math.pow(2, zoom);
	// Y 轴反转：MVT Y轴向下，Mercator Tile Y是自上而下，需要反转
	const normalizedY = (tileY + y / extent) / Math.pow(2, zoom);

	// 转换为经纬度 (Lng)
	const lon = normalizedX * 360.0 - 180.0;

	// 转换为经纬度 (Lat)，使用 Web Mercator 逆投影公式
	const latRad = Math.atan(Math.sinh(PI * (1 - 2 * normalizedY)));
	const lat = latRad * 180.0 / PI;

	// 返回 [Lng, Lat] 数组，符合 GeoJSON 规范
	return [
		parseFloat(lon.toFixed(8)), // Lng
		parseFloat(lat.toFixed(8)),  // Lat
	];
}


/**
 * 转换整个geometry数据结构
 * @param geometryData - MVT解析出的 geometry 数据结构（包含 Vector2 对象）
 * @param tileX - 瓦片X坐标
 * @param tileY - 瓦片Y坐标
 * @param zoom - 缩放级别
 * @returns {Object} 包含 WGS84 坐标数组的 GeoJSON geometry 对象 `{ type: string, coordinates: any }`
 */
export function convertGeometryToWGS84(geometryData: any, tileX: number, tileY: number, zoom: number): GeoJSONGeometry { // 

	if (!geometryData || !geometryData.coordinates) {
		throw new Error('无效的geometry数据格式');
	}

	// 移除深拷贝，直接创建 GeoJSON 兼容的返回对象
	const result: GeoJSONGeometry = {
		type: geometryData.type,
		coordinates: null
	};

	/**
		 * 递归转换坐标数组或单个 Vector2 对象
		 */
	function convertCoordinates(coords: any): any {
		// **最内层检查：处理单个 Vector2 对象**
		// Point, MultiPoint 的 coordinates 最内层是 Vector2
		if (typeof coords === 'object' && coords.x !== undefined && coords.y !== undefined) {
			// **Point** 类型的 coordinates 是单个 Vector2，直接转换
			return vector2ToWGS84(coords as Vector2, tileX, tileY, zoom);
		}

		// **次内层检查：处理 Vector2 数组 (如 LineString/Ring)**
		if (Array.isArray(coords) && coords.length > 0) {
			const firstItem = coords[0];

			// 检查是否是 Vector2 对象数组 (如 LineString 或 Polygon 的 Ring)
			if (typeof firstItem === 'object' && firstItem.x !== undefined && firstItem.y !== undefined) {
				// 这是最内层数组（LineString/Ring），执行转换，返回 [Lng, Lat] 数组
				return coords.map((vector2: Vector2) => vector2ToWGS84(vector2, tileX, tileY, zoom));
			} else {
				// 这是嵌套数组，继续递归
				return coords.map((item: any) => convertCoordinates(item));
			}
		}
		return coords;
	}

	// 执行转换
	result.coordinates = convertCoordinates(geometryData.coordinates);

	return result;
}