import { IGeometryData } from "./GeometryTypes";

/**
 * 几何体辅助工具类
 * @class GeometryHelper
 */
export class GeometryHelper {
    /**
     * 连接多个类型化数组
     * @param arrays 要连接的数组列表
     * @returns 连接后的新数组
     */
    public static concatenateTypedArrays<T extends Float32Array | Uint16Array | Uint32Array | Int16Array | Int32Array | Uint8Array | Int8Array>(
        ...arrays: T[]
    ): T {
        if (!arrays || arrays.length === 0) {
            throw new Error("[GeometryHelper] No arrays provided to concatenate.");
        }
        
        // 检查构造函数一致性 (简化检查)
        const Ctor = arrays[0].constructor as new (len: number) => T;
        
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Ctor(totalLength);
        
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        
        return result;
    }

    /**
     * 计算网格法线
     * @param vertices 顶点位置数组 (x, y, z, ...)
     * @param indices 索引数组
     * @returns 法线数组
     */
    public static computeVertexNormals(vertices: Float32Array, indices: Uint16Array | Uint32Array): Float32Array {
        const normals = new Float32Array(vertices.length);
        
        // 初始化法线为0
        // (Float32Array 默认为 0，不需要显式 fill(0))

        // 遍历每个三角形，累加面法线到顶点
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i] * 3;
            const i1 = indices[i + 1] * 3;
            const i2 = indices[i + 2] * 3;

            const x0 = vertices[i0], y0 = vertices[i0 + 1], z0 = vertices[i0 + 2];
            const x1 = vertices[i1], y1 = vertices[i1 + 1], z1 = vertices[i1 + 2];
            const x2 = vertices[i2], y2 = vertices[i2 + 1], z2 = vertices[i2 + 2];

            // 向量 AB = P1 - P0
            const ux = x1 - x0;
            const uy = y1 - y0;
            const uz = z1 - z0;

            // 向量 AC = P2 - P0
            const vx = x2 - x0;
            const vy = y2 - y0;
            const vz = z2 - z0;

            // 叉乘计算法线: N = AB x AC
            const nx = uy * vz - uz * vy;
            const ny = uz * vx - ux * vz;
            const nz = ux * vy - uy * vx;

            // 累加到三个顶点
            normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
            normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
            normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
        }

        // 归一化每个顶点的法线
        for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];
            const len = Math.sqrt(x * x + y * y + z * z);
            
            if (len > 0) {
                normals[i] /= len;
                normals[i + 1] /= len;
                normals[i + 2] /= len;
            } else {
                // 默认向上
                normals[i] = 0;
                normals[i + 1] = 0;
                normals[i + 2] = 1;
            }
        }

        return normals;
    }

    /**
     * 生成规则网格的索引
     * @param rows 行数 (Height)
     * @param cols 列数 (Width)
     */
    public static generateGridIndices(rows: number, cols: number): Uint16Array | Uint32Array {
        const indicesCount = (rows - 1) * (cols - 1) * 6;
        // 根据顶点数量选择合适的数组类型
        const Ctor = (rows * cols) > 65535 ? Uint32Array : Uint16Array;
        const indices = new Ctor(indicesCount);
        
        let ptr = 0;
        for (let y = 0; y < rows - 1; y++) {
            for (let x = 0; x < cols - 1; x++) {
                const a = y * cols + x;
                const b = a + 1;
                const c = (y + 1) * cols + x;
                const d = c + 1;

                // 两个三角形: (a, b, c) 和 (c, b, d)
                indices[ptr++] = a;
                indices[ptr++] = b;
                indices[ptr++] = c;
                
                indices[ptr++] = c;
                indices[ptr++] = b;
                indices[ptr++] = d;
            }
        }
        return indices;
    }

    /**
     * 从 DEM 数据生成几何数据
     * @param demData DEM 高度数据
     * @returns IGeometryData
     */
    public static fromDEM(demData: Float32Array): IGeometryData {
        if (demData.length < 4) {
            throw new Error("[GeometryHelper] DEM data too small.");
        }

        const size = Math.floor(Math.sqrt(demData.length));
        const width = size;
        const height = size;

        const indices = this.generateGridIndices(height, width);
        
        const numVertices = width * height;
        const positions = new Float32Array(numVertices * 3);
        const uvs = new Float32Array(numVertices * 2);

        let ptr = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // 归一化坐标
                const u = x / (width - 1);
                const v = y / (height - 1);

                // UV
                uvs[ptr * 2] = u;
                uvs[ptr * 2 + 1] = v;

                // Position (centered at 0,0)
                positions[ptr * 3] = u - 0.5;
                positions[ptr * 3 + 1] = v - 0.5;
                // 注意：原代码 Y 轴是反转的读取 DEM? dem[(height - y - 1) * width + x]
                // 保持原逻辑一致性
                positions[ptr * 3 + 2] = demData[(height - y - 1) * width + x];

                ptr++;
            }
        }

        const normals = this.computeVertexNormals(positions, indices);

        return {
            attributes: {
                position: { value: positions, size: 3 },
                texcoord: { value: uvs, size: 2 },
                normal: { value: normals, size: 3 }
            },
            indices: indices
        };
    }
}
