/**
 * Layer paint class: Handles rule matching logic
 * 样式层级类：处理规则匹配逻辑
 * @category Paint
 */
export class LayerPaint {
    /**
     * @param rules Paint rule array or single PaintConfig.
     * @param filterEngine External Feature Filter engine instance
     */
    constructor(rules, filterEngine) {
        Object.defineProperty(this, "filterEngine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: filterEngine
        });
        Object.defineProperty(this, "rules", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // If only a single PaintConfig is passed, automatically create a default rule
        if (!Array.isArray(rules)) {
            // Default rule filter is set to true or other expression that matches all features
            this.rules = [{ paint: rules, filter: true }];
        }
        else {
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
    getPaint(rawFeature, zoom) {
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
