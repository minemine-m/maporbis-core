/**
 * 必填参数校验工具
 * @description 用于校验参数是否为undefined/null/空字符串，不符合条件时抛出错误
 * @template T 参数值的类型
 * @param value 待校验的值
 * @param paramName 参数名称（用于错误提示）
 * @param customErrorMsg 自定义错误信息（可选）
 * @throws {Error} 当值为空时抛出错误，包含参数名和接收到的值
 * @returns 通过校验的值
 * 
 * @example
 * // 基本用法
 * const id = requireParam(input.id, 'id');
 * 
 * @example
 * // 自定义错误信息
 * const name = requireParam(user.name, 'name', '用户名不能为空');
  * @category Utils
 */
export function requireParam<T>(
    value: T | undefined | null,
    paramName: string,
    customErrorMsg?: string
): T {
    if (value === undefined || value === null || value === '') {
        throw new Error(
            customErrorMsg || `Parameter "${paramName}" is required but received: ${value}`
        );
    }
    return value;
}

/**
 * 对象属性必填校验（支持深层嵌套）
 * @description 用于校验对象深层属性是否存在，如果路径中任何一级属性不存在则抛出错误
 * @template T 返回值的类型
 * @param obj 待校验对象
 * @param propPath 属性路径（使用点号分隔，如 'a.b.c'）
 * @param customErrorMsg 自定义错误信息（可选）
 * @throws {Error} 当属性不存在时抛出错误，包含完整路径和缺失的节点
 * @returns 通过校验的属性值
 * 
 * @example
 * // 基本用法
 * const value = requireProp({ a: { b: 1 } }, 'a.b'); // 返回 1
 * 
 * @example
 * // 抛出错误的场景
 * requireProp({}, 'a.b'); // 抛出错误: Property "a.b" is required but missing at path: "a"
 * 
 * @example
 * // 自定义错误信息
 * const config = requireProp(settings, 'server.port', '服务器端口配置缺失');
  * @category Utils
 */
export function requireProp<T>(
    obj: Record<string, any>,
    propPath: string,
    customErrorMsg?: string
): T {
    const pathSegments = propPath.split('.');
    let current: any = obj;

    for (const segment of pathSegments) {
        if (current[segment] === undefined || current[segment] === null) {
            throw new Error(
                customErrorMsg || `Property "${propPath}" is required but missing at path: "${segment}"`
            );
        }
        current = current[segment];
    }

    return current as T;
}


/**
 * @category Utils
 */
export function mapValue(
    value: number,
    min1: number,
    max1: number,
    min2: number = 0,
    max2: number = 1
): number {
    // 处理输入范围为0的情况
    if (min1 === max1) {
        return min2;
    }

    const res = ((value - min1) * (max2 - min2) / (max1 - min1)) + min2;

    // 确保结果在目标范围内（支持双向）
    const actualMin2 = Math.min(min2, max2);
    const actualMax2 = Math.max(min2, max2);

    if (res < actualMin2) return actualMin2;
    if (res > actualMax2) return actualMax2;

    return res || 0;
}