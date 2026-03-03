import { Feature } from '../Feature';
import { FeatureEditHandler, FeatureEditHandlerOptions } from '../../handler/edit/FeatureEditHandler';

/**
 * Feature editing interface extension.
 * Feature 编辑接口扩展
 * 
 * @description
 * Adds editing capabilities to the Feature class:
 * - startEdit(): Start editing
 * - endEdit(): End editing
 * - isEditing(): Check if editing is active
 * - cancelEdit(): Cancel editing
 * - undoEdit(): Undo edit
 * - redoEdit(): Redo edit
 * 
 * 为 Feature 类添加编辑功能的方法：
 * - startEdit(): 开始编辑
 * - endEdit(): 结束编辑
 * - isEditing(): 检查是否正在编辑
 * - cancelEdit(): 取消编辑
 * - undoEdit(): 撤销编辑
 * - redoEdit(): 重做编辑
 */

declare module '../Feature' {
    interface Feature {
        /**
         * Editor instance.
         * 编辑器实例
         * @private
         */
        _editor?: FeatureEditHandler;
        
        /**
         * Start editing the feature.
         * 开始编辑要素
         * 
         * @param options - Edit configuration options
         *                编辑配置选项
         * @returns Feature instance (supports chaining)
         *          要素实例（支持链式调用）
         * 
         * @example
         * ```typescript
         * feature.startEdit({
         *     handleSize: 12,
         *     handleColor: '#ff0000'
         * });
         * ```
         */
        startEdit(options?: FeatureEditHandlerOptions): this;
        
        /**
         * End editing the feature.
         * 结束编辑要素
         * 
         * @returns Feature instance (supports chaining)
         *          要素实例（支持链式调用）
         * 
         * @example
         * ```typescript
         * feature.endEdit();
         * ```
         */
        endEdit(): this;
        
        /**
         * Check if the feature is currently being edited.
         * 检查要素是否正在编辑
         * 
         * @returns Whether editing is active
         *          是否正在编辑
         * 
         * @example
         * ```typescript
         * if (feature.isEditing()) {
         *     console.log('Feature is being edited');
         * }
         * ```
         */
        isEditing(): boolean;
        
        /**
         * Cancel editing (revert to state before editing).
         * 取消编辑（恢复到编辑前的状态）
         * 
         * @returns Feature instance (supports chaining)
         *          要素实例（支持链式调用）
         * 
         * @example
         * ```typescript
         * feature.cancelEdit();
         * ```
         */
        cancelEdit(): this;
        
        /**
         * Undo edit operation.
         * 撤销编辑操作
         * 
         * @returns Feature instance (supports chaining)
         *          要素实例（支持链式调用）
         * 
         * @example
         * ```typescript
         * feature.undoEdit();
         * ```
         */
        undoEdit(): this;
        
        /**
         * Redo edit operation.
         * 重做编辑操作
         * 
         * @returns Feature instance (supports chaining)
         *          要素实例（支持链式调用）
         * 
         * @example
         * ```typescript
         * feature.redoEdit();
         * ```
         */
        redoEdit(): this;
    }
}

/**
 * Start editing the feature.
 * 开始编辑要素
 */
Feature.prototype.startEdit = function (options?: FeatureEditHandlerOptions): Feature {
    if (!this.options?.editable) {
        console.warn('Feature is not editable. Set editable option to true.');
        return this;
    }
    
    // If already editing, end previous edit first
    // 如果已经在编辑，先结束之前的编辑
    if (this._editor) {
        this.endEdit();
    }
    
    // Create editor
    // 创建编辑器
    this._editor = new FeatureEditHandler(this, options);
    this._editor.enable();
    
    return this;
};

/**
 * End editing the feature.
 * 结束编辑要素
 */
Feature.prototype.endEdit = function (): Feature {
    if (this._editor) {
        this._editor.disable();
        this._editor.remove();
        delete this._editor;
    }
    
    return this;
};

/**
 * Check if the feature is currently being edited.
 * 检查要素是否正在编辑
 */
Feature.prototype.isEditing = function (): boolean {
    return this._editor ? this._editor.isEditing() : false;
};

/**
 * Cancel editing (revert to state before editing).
 * 取消编辑（恢复到编辑前的状态）
 */
Feature.prototype.cancelEdit = function (): Feature {
    if (this._editor) {
        this._editor.cancel();
    }
    
    return this;
};

/**
 * Undo edit operation.
 * 撤销编辑操作
 */
Feature.prototype.undoEdit = function (): Feature {
    if (this._editor) {
        this._editor.undo();
    }
    
    return this;
};

/**
 * Redo edit operation.
 * 重做编辑操作
 */
Feature.prototype.redoEdit = function (): Feature {
    if (this._editor) {
        this._editor.redo();
    }
    
    return this;
};

// Export to ensure module is loaded
// 导出以确保模块被加载
export {};
