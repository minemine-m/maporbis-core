/**
 * 评估一个 Mapbox 风格的 filter 对某个要素是否成立
 * Evaluate if a Mapbox style filter matches a feature
 * @param filter 过滤条件 Filter condition
 * @param properties 要素属性 Feature properties
 * @returns 是否匹配 True if matched, false otherwise
  * @category Style
 */
export declare function matchFilter(filter: any, properties: any): boolean;
