import { IGeometryData } from "./GeometryTypes";
import { GeometryHelper } from "./GeometryHelper";

export interface IEdgeIndices {
    west: Uint16Array | Uint32Array;
    south: Uint16Array | Uint32Array;
    east: Uint16Array | Uint32Array;
    north: Uint16Array | Uint32Array;
}

/**
 * 几何体裙边生成工具
 * @class GeometrySkirtUtils
 */
export class GeometrySkirtUtils {
    /**
     * 为几何体添加裙边 (Skirt)
     * @description 防止地形瓦片之间出现裂缝
     * @param geometryData 原始几何体数据
     * @param skirtHeight 裙边高度 (向下延伸的距离)
     * @param externalEdgeIndices 可选的预计算边缘索引
     */
    public static addSkirt(
        geometryData: IGeometryData,
        skirtHeight: number,
        externalEdgeIndices?: IEdgeIndices
    ): IGeometryData {
        const originalPos = geometryData.attributes.position.value;
        const originalUV = geometryData.attributes.texcoord.value;
        const originalNorm = geometryData.attributes.normal.value;
        const originalIndices = geometryData.indices;

        // 获取边缘列表 [[idx1, idx2], ...]
        const edges = externalEdgeIndices 
            ? this.getEdgesFromIndices(externalEdgeIndices, originalPos) 
            : this.extractBoundaryEdges(originalIndices);

        const edgeCount = edges.length;
        if (edgeCount === 0) return geometryData;

        // 每条边增加 2 个顶点 (下方的新顶点)
        const addedVertexCount = edgeCount * 2;
        
        const newPos = new Float32Array(addedVertexCount * 3);
        const newUV = new Float32Array(addedVertexCount * 2);
        const newNorm = new Float32Array(addedVertexCount * 3);
        
        // 确定索引数组类型
        const totalVertices = originalPos.length / 3 + addedVertexCount;
        const IndexArrayType = totalVertices > 65535 ? Uint32Array : Uint16Array;
        // 如果原始索引已经是 Uint32，则保持 Uint32
        const TargetType = (originalIndices instanceof Uint32Array) ? Uint32Array : IndexArrayType;
        
        const newInds = new TargetType(edgeCount * 6);

        let vPtr = 0; // vertex pointer (relative to new arrays)
        let iPtr = 0; // index pointer
        const baseIndex = originalPos.length / 3;

        for (let i = 0; i < edgeCount; i++) {
            const edge = edges[i]; // [idx1, idx2]
            const idx1 = edge[0];
            const idx2 = edge[1];

            // 1. 获取原始顶点数据
            const x1 = originalPos[idx1 * 3];
            const y1 = originalPos[idx1 * 3 + 1];
            const z1 = originalPos[idx1 * 3 + 2];
            
            const x2 = originalPos[idx2 * 3];
            const y2 = originalPos[idx2 * 3 + 1];
            const z2 = originalPos[idx2 * 3 + 2];

            const u1 = originalUV[idx1 * 2];
            const v1 = originalUV[idx1 * 2 + 1];
            const u2 = originalUV[idx2 * 2];
            const v2 = originalUV[idx2 * 2 + 1];

            // 2. 创建下垂顶点 (z - skirtHeight)
            // Vertex 1' (对应 idx1)
            newPos[vPtr * 3 + 0] = x1;
            newPos[vPtr * 3 + 1] = y1;
            newPos[vPtr * 3 + 2] = z1 - skirtHeight;
            newUV[vPtr * 2 + 0] = u1;
            newUV[vPtr * 2 + 1] = v1;
            // 设置默认法线 (垂直向上，或者侧向) - 这里设为(0,0,1)保持与原逻辑一致
            newNorm[vPtr * 3 + 0] = 0;
            newNorm[vPtr * 3 + 1] = 0;
            newNorm[vPtr * 3 + 2] = 1;

            const newIdx1 = baseIndex + vPtr;
            vPtr++;

            // Vertex 2' (对应 idx2)
            newPos[vPtr * 3 + 0] = x2;
            newPos[vPtr * 3 + 1] = y2;
            newPos[vPtr * 3 + 2] = z2 - skirtHeight;
            newUV[vPtr * 2 + 0] = u2;
            newUV[vPtr * 2 + 1] = v2;
            newNorm[vPtr * 3 + 0] = 0;
            newNorm[vPtr * 3 + 1] = 0;
            newNorm[vPtr * 3 + 2] = 1;

            const newIdx2 = baseIndex + vPtr;
            vPtr++;

            // 3. 构建裙边三角形 (注意绕序，使其面朝外)
            // 假设 idx1 -> idx2 是逆时针边界，则面朝外。
            // 裙边向下延伸，需要两个三角形：
            // T1: idx1 -> newIdx2 -> idx2 (此顺序可能反了，取决于坐标系)
            // 原代码逻辑：
            // newTriangles[... + 0] = edge[0]; (idx1)
            // newTriangles[... + 1] = ... + vertex2Offset; (newIdx2)
            // newTriangles[... + 2] = edge[1]; (idx2)
            // -> idx1, newIdx2, idx2
            
            newInds[iPtr++] = idx1;
            newInds[iPtr++] = newIdx2;
            newInds[iPtr++] = idx2;

            // T2: idx1 -> newIdx1 -> newIdx2
            // 原代码逻辑:
            // newTriangles[... + 3] = ... + vertex2Offset; (newIdx2)
            // newTriangles[... + 4] = edge[0]; (idx1)
            // newTriangles[... + 5] = ... + vertex1Offset; (newIdx1)
            // -> newIdx2, idx1, newIdx1
            
            newInds[iPtr++] = newIdx2;
            newInds[iPtr++] = idx1;
            newInds[iPtr++] = newIdx1;
        }

        // 合并所有数据
        return {
            attributes: {
                position: { value: GeometryHelper.concatenateTypedArrays(originalPos, newPos), size: 3 },
                texcoord: { value: GeometryHelper.concatenateTypedArrays(originalUV, newUV), size: 2 },
                normal: { value: GeometryHelper.concatenateTypedArrays(originalNorm, newNorm), size: 3 }
            },
            indices: GeometryHelper.concatenateTypedArrays(originalIndices, newInds)
        };
    }

    /**
     * 从网格索引中提取边界边
     * @param indices 三角形索引
     */
    private static extractBoundaryEdges(indices: Uint16Array | Uint32Array): number[][] {
        const edges: number[][] = [];
        
        // 1. 收集所有边
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i];
            const b = indices[i + 1];
            const c = indices[i + 2];
            edges.push([a, b], [b, c], [c, a]);
        }

        // 2. 排序边以方便比较 (min, max)
        // 为了区分方向，我们保留原始方向，但比较时使用排序后的 key
        // 实际上，边界边是只出现一次的边。
        // 使用 Map 统计边出现次数。Key: "min-max"
        
        const edgeCountMap = new Map<string, number>();
        const edgeSourceMap = new Map<string, number[]>(); // Store original directed edge

        for (const edge of edges) {
            const key = edge[0] < edge[1] ? `${edge[0]}-${edge[1]}` : `${edge[1]}-${edge[0]}`;
            edgeCountMap.set(key, (edgeCountMap.get(key) || 0) + 1);
            if (!edgeSourceMap.has(key)) {
                edgeSourceMap.set(key, edge);
            }
        }

        // 3. 筛选只出现一次的边 (边界)
        const boundaryEdges: number[][] = [];
        edgeCountMap.forEach((count, key) => {
            if (count === 1) {
                boundaryEdges.push(edgeSourceMap.get(key)!);
            }
        });

        return boundaryEdges;
    }

    /**
     * 根据预定义的边缘索引获取边列表
     * @param indices 边缘索引组
     * @param position 顶点位置 (用于排序)
     */
    private static getEdgesFromIndices(indices: IEdgeIndices, position: Float32Array): number[][] {
        const edges: number[][] = [];

        // 辅助排序函数
        const sortIndices = (arr: Uint16Array | Uint32Array, compareFn: (a: number, b: number) => number) => {
            // 需要转为普通数组才能 sort (TypedArray sort is in-place but browser compatibility varies? Standard is yes.)
            // 为了安全，Array.from
            const sorted = Array.from(arr).sort(compareFn);
            return sorted;
        };

        // 获取位置辅助
        const getX = (i: number) => position[i * 3];
        const getY = (i: number) => position[i * 3 + 1];

        // 排序逻辑 (复刻原代码)
        // West: sort by Y asc
        const west = sortIndices(indices.west, (a, b) => getY(a) - getY(b));
        // East: sort by Y desc (b - a)? 原代码: position[3*b+1] - position[3*a+1] => Descending Y
        const east = sortIndices(indices.east, (a, b) => getY(b) - getY(a));
        // South: sort by X desc? 原代码: position[3*b] - position[3*a] => Descending X
        const south = sortIndices(indices.south, (a, b) => getX(b) - getX(a));
        // North: sort by X asc? 原代码: position[3*a] - position[3*b] => Ascending X
        const north = sortIndices(indices.north, (a, b) => getX(a) - getX(b));

        // 生成边
        const processGroup = (group: number[]) => {
            if (group.length > 1) {
                for (let i = 0; i < group.length - 1; i++) {
                    edges.push([group[i], group[i + 1]]);
                }
            }
        };

        processGroup(west);
        processGroup(east);
        processGroup(south);
        processGroup(north);

        return edges;
    }
}
