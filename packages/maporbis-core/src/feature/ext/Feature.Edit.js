import { Feature } from '../Feature';
import { FeatureEditHandler } from '../../handler/edit/FeatureEditHandler';
/**
 * Start editing the feature.
 * 开始编辑要素
 */
Feature.prototype.startEdit = function (options) {
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
Feature.prototype.endEdit = function () {
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
Feature.prototype.isEditing = function () {
    return this._editor ? this._editor.isEditing() : false;
};
/**
 * Cancel editing (revert to state before editing).
 * 取消编辑（恢复到编辑前的状态）
 */
Feature.prototype.cancelEdit = function () {
    if (this._editor) {
        this._editor.cancel();
    }
    return this;
};
/**
 * Undo edit operation.
 * 撤销编辑操作
 */
Feature.prototype.undoEdit = function () {
    if (this._editor) {
        this._editor.undo();
    }
    return this;
};
/**
 * Redo edit operation.
 * 重做编辑操作
 */
Feature.prototype.redoEdit = function () {
    if (this._editor) {
        this._editor.redo();
    }
    return this;
};
