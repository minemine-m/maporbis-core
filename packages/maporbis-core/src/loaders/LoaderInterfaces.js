import { LoadingManager } from "three";
/**
 * 瓦片加载管理器
 */
export class TileLoadingManager extends LoadingManager {
    onParseEnd = undefined;
    parseEnd(url) {
        if (this.onParseEnd) {
            this.onParseEnd(url);
        }
    }
}
