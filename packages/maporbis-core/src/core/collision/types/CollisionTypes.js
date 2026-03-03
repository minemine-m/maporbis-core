/**
 * 碰撞类型枚举
 *
 * @description
 * 定义不同类型的要素在避让系统中的处理方式。
 * 不同类型的要素使用不同的包围盒计算策略。
  * @category Core
 */
export var CollisionType;
(function (CollisionType) {
    /** 点要素 - 使用圆形或小方形包围盒 */
    CollisionType["POINT"] = "point";
    /** 线要素的顶点 - 沿线分布的多个点 */
    CollisionType["LINE_VERTEX"] = "line_vertex";
    /** 面要素的中心点 - 通常用于面要素的标签定位 */
    CollisionType["POLYGON_CENTER"] = "polygon_center";
    /** 文字标签 - 考虑文字内容和字体大小的矩形区域 */
    CollisionType["LABEL"] = "label";
    /** 图标要素 - 固定尺寸的方形或圆形区域 */
    CollisionType["ICON"] = "icon";
    /** 聚合要素 - 代表多个要素的聚合点 */
    CollisionType["CLUSTER"] = "cluster";
})(CollisionType || (CollisionType = {}));
/**
 * 碰撞原因枚举
 *
 * @description
 * 记录要素可见性变化的详细原因，用于调试和不同原因的特殊处理。
  * @category Core
 */
export var CollisionReason;
(function (CollisionReason) {
    /** 无碰撞 - 要素正常显示 */
    CollisionReason["NO_COLLISION"] = "no_collision";
    /** 优先级失败 - 与其他要素碰撞且优先级较低 */
    CollisionReason["PRIORITY_LOST"] = "priority_lost";
    /** 超出视口 - 要素位于屏幕可见区域之外 */
    CollisionReason["OUT_OF_VIEWPORT"] = "out_of_viewport";
    /** 层级过滤 - 当前缩放级别不满足显示条件 */
    CollisionReason["ZOOM_FILTERED"] = "zoom_filtered";
    /** 手动隐藏 - 用户主动隐藏该要素 */
    CollisionReason["MANUAL_HIDDEN"] = "manual_hidden";
    /** 组碰撞 - 与同一组内的其他要素发生碰撞 */
    CollisionReason["GROUP_COLLISION"] = "group_collision";
})(CollisionReason || (CollisionReason = {}));
