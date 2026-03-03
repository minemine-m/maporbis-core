
import { TerrainMeshBuilder } from "../../geometries/TerrainMeshBuilder";
import { IGeometryData } from "../../geometries/GeometryTypes";

//@ts-ignore
import Lerc from "./lercDecode.js";

/**
 * DEM Data Structure
 * DEM 数据结构
 */
export type DEMType = {
	array: Float32Array;
	width: number;
	height: number;
};

const maxErrors: { [key: number]: number } = {
	0: 7000,
	1: 6000,
	2: 5000,
	3: 4000,
	4: 3000,
	5: 2500,
	6: 2000,
	7: 1500,
	8: 800,
	9: 500,
	10: 200,
	11: 100,
	12: 40,
	13: 12,
	14: 5,
	15: 2,
	16: 1,
	17: 0.5,
	18: 0.2,
	19: 0.1,
	20: 0.01,
};

/**
 * LERC Format Parser
 * LERC 格式解析器
 * 
 * @description
 * Parses LERC compressed terrain data and generates mesh geometry using TerrainMeshBuilder.
 * 解析 LERC 压缩地形数据并使用 TerrainMeshBuilder 生成网格几何体。
 */
export class LERCParser {
	/**
	 * Parse LERC data to geometry
	 * 解析 LERC 数据为几何体
	 * 
	 * @param buffer LERC data buffer
	 * @param z Zoom level
	 * @param clipBounds Clip bounds
	 * @returns Geometry data
	 */
	public static parse(buffer: ArrayBuffer, z: number, clipBounds: [number, number, number, number]): IGeometryData {
		let demData = LERCParser.decode(buffer);
		
		// Handle clipping if needed (when fetching from parent tile)
		// 如果需要剪裁（从父瓦片获取时）
		if (clipBounds[2] - clipBounds[0] < 1) {
			demData = LERCParser.getSubDEM(demData, clipBounds);
		}

		const { array: terrain, width: gridSize } = demData;

		// Create TerrainMeshBuilder instance
		// 创建 TerrainMeshBuilder 实例
		const builder = new TerrainMeshBuilder(gridSize);
		
		// Get max error for current zoom level
		// 获取当前缩放级别的最大误差
		const maxError = maxErrors[z] || 0;
		
		// Build geometry
		// 构建几何体
		return builder.build(terrain, maxError);
	}

	/**
	 * Decode Lerc data
	 * 解码 Lerc 数据
	 */
	private static decode(buffer: ArrayBuffer): DEMType {
		const { height, width, pixels } = Lerc.decode(buffer);
		const demArray = new Float32Array(height * width);
		// Flatten array
		for (let i = 0; i < demArray.length; i++) {
			demArray[i] = pixels[0][i];
		}
		return { array: demArray, width, height };
	}

	/**
	 * Get sub-DEM data
	 * 获取子 DEM 数据
	 */
	private static getSubDEM(demData: DEMType, bounds: [number, number, number, number]): DEMType {
		// Array clip and resize logic
		function arrayClipAndResize(
			buffer: Float32Array,
			width: number,
			sx: number,
			sy: number,
			sw: number,
			sh: number,
			dw: number,
			dh: number
		) {
			// clip
			const clippedData = new Float32Array(sw * sh);
			for (let row = 0; row < sh; row++) {
				for (let col = 0; col < sw; col++) {
					const sourceIndex = (row + sy) * width + (col + sx);
					const destIndex = row * sw + col;
					clippedData[destIndex] = buffer[sourceIndex];
				}
			}

			// resize
			const resizedData = new Float32Array(dh * dw);
			// Simple nearest neighbor or linear interpolation could be used here.
			// Currently seemingly just a placeholder or needing implementation if resize is required.
			// But looking at original code, it was incomplete/implicit.
			// Let's implement a simple copy/resize if dimensions match, or nearest neighbor.
			
			// If dimensions match, just copy (common case for tiling split)
			// 如果尺寸匹配，直接复制
			if (sw === dw && sh === dh) {
				resizedData.set(clippedData);
			} else {
				// Simple nearest neighbor resize
				const scaleX = sw / dw;
				const scaleY = sh / dh;
				for (let r = 0; r < dh; r++) {
					for (let c = 0; c < dw; c++) {
						const srcX = Math.floor(c * scaleX);
						const srcY = Math.floor(r * scaleY);
						const srcIdx = srcY * sw + srcX;
						resizedData[r * dw + c] = clippedData[srcIdx];
					}
				}
			}
			return resizedData;
		}

		const { array, width } = demData;
		const { sx, sy, sw, sh } = LERCParser.getBoundsCoord(bounds, width);
		
		// Target size usually matches source grid size for consistency
		const targetSize = width; 
		
		const newArray = arrayClipAndResize(array, width, sx, sy, sw, sh, targetSize, targetSize);
		
		return {
			array: newArray,
			width: targetSize,
			height: targetSize
		};
	}

	/**
	 * Helper to calculate clip coordinates
	 */
	private static getBoundsCoord(clipBounds: [number, number, number, number], targetSize: number) {
		const sx = Math.floor(clipBounds[0] * targetSize);
		const sy = Math.floor(clipBounds[1] * targetSize);
		const sw = Math.floor((clipBounds[2] - clipBounds[0]) * targetSize);
		const sh = Math.floor((clipBounds[3] - clipBounds[1]) * targetSize);
		return { sx, sy, sw, sh };
	}
}
