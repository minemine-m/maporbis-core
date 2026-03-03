import { LoadingManager } from "three";
/**
 * 瓦片加载管理器
 */
export class TileLoadingManager extends LoadingManager {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "onParseEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
    }
    parseEnd(url) {
        if (this.onParseEnd) {
            this.onParseEnd(url);
        }
    }
}
