import { PaintConfig } from './index'; 

/**
 * Paint rule interface (Simplified)
 * 样式规则接口 (简化版)
 * @description Defines a paint rule that will be applied via an external Feature Filter mechanism.
 * 定义一个样式规则，它将通过外部的 Feature Filter 机制来应用。
 * @category Paint
 */
export interface PaintRule {
    /**
     * Filter condition expression (Placeholder)
     * 过滤条件表达式（Placeholder）
     * This is a placeholder to represent a future feature-filter expression or rule ID.
     * 这是一个占位符，用于表示您将来要引入的 feature-filter 表达式或规则ID。
     * e.g., ['==', 'class', 'highway'] or 'highway-z10-14'
     * 例如: ['==', 'class', 'highway'] 或 'highway-z10-14'
     */
    filter: any; 

    /** Paint configuration */
    paint: PaintConfig;
}

/**
 * Tile paint input type (currently an array of rules)
 * 瓦片样式输入类型 (现在是一个规则数组)
 * @category Paint
 */
export type TilePaintRuleInput = PaintRule[];

/**
 * Layer paint class: Handles rule matching logic
 * 样式层级类：处理规则匹配逻辑
 * @category Paint
 */
export class LayerPaint {
    private rules: PaintRule[];

    /**
     * @param rules Paint rule array or single PaintConfig.
     * @param filterEngine External Feature Filter engine instance
     */
    constructor(rules: PaintRule[] | PaintConfig, private filterEngine?: any) {
        // If only a single PaintConfig is passed, automatically create a default rule
        if (!Array.isArray(rules)) {
            // Default rule filter is set to true or other expression that matches all features
            this.rules = [{ paint: rules, filter: true }]; 
        } else {
            this.rules = rules;
        }
    }

    /**
     * Get matching paint configuration based on feature properties and zoom level
     * 根据要素属性和缩放级别获取匹配的样式配置
     * @param rawFeature Raw feature data (includes properties)
     * @param zoom Zoom level
     * @returns Matching PaintConfig or null (no match)
     */
    public getPaint(rawFeature: any, zoom: number): PaintConfig | null {
        // Iterate through rules
        for (const rule of this.rules) {
            
            // Core logic: Use external filterEngine to determine match
            
            // If no filterEngine and filter is true, match (as default style)
            if (!this.filterEngine && rule.filter === true) {
                 return rule.paint;
            }
            
            // If filterEngine exists, use it to evaluate expression
            if (this.filterEngine && this.filterEngine.evaluate(rule.filter, rawFeature.properties, zoom)) {
                return rule.paint;
            }
        }
        return null; // No rule matched
    }
}
