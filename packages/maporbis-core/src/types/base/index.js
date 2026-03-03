/**
 * Convert named anchor position to numeric [x, y] array.
 * 将命名锚点位置转换为数值 [x, y] 数组
 * @param anchor - Named anchor position or numeric array
 * @returns Numeric [x, y] array where x and y are in range [0, 1]
 *
 * @example
 * normalizeAnchor('top-right') // returns [1, 1]
 * normalizeAnchor([0.3, 0.7]) // returns [0.3, 0.7]
 * normalizeAnchor('center') // returns [0.5, 0.5]
 *
 * @category Types
 */
export function normalizeAnchor(anchor) {
    if (!anchor)
        return [0.5, 0.5]; // default center
    if (Array.isArray(anchor)) {
        return anchor;
    }
    // Convert named position to numeric coordinates
    switch (anchor) {
        case 'top-left':
            return [0, 1];
        case 'top':
            return [0.5, 1];
        case 'top-right':
            return [1, 1];
        case 'left':
            return [0, 0.5];
        case 'center':
            return [0.5, 0.5];
        case 'right':
            return [1, 0.5];
        case 'bottom-left':
            return [0, 0];
        case 'bottom':
            return [0.5, 0];
        case 'bottom-right':
            return [1, 0];
        default:
            return [0.5, 0.5];
    }
}
