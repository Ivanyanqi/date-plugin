# date-plugin 技术架构指南

## 文档目的

这份文档是 `date-plugin` 演进为可维护产品时的技术基准。它定义模块边界、运行时职责分层、状态模型以及每一轮迭代都必须遵守的质量约束。

## 架构目标

1. 将纯日期逻辑与 DOM 行为彻底分离
2. 让渲染层可替换，而不影响业务规则
3. 每个 picker 实例只有一个权威状态对象
4. 避免隐式全局可变状态
5. 让用户交互能够被观察、验证和回归测试
6. 后续技术文档默认使用中文

## 运行时分层

### 1. Core 层

纯逻辑层，不依赖 DOM。

职责：

- 生成月份视图所需的日历网格数据
- 处理日期格式化与解析
- 归一化约束和禁用规则
- 回答“某一天是否可选”等业务问题

候选模块：

- [src/core/calendar.js](../src/core/calendar.js)
- [src/core/format.js](../src/core/format.js)
- [src/core/constraints.js](../src/core/constraints.js)

### 2. State 层

实例级运行时状态层。

职责：

- 记录是否打开
- 记录当前可见月份
- 记录当前选中日期
- 记录键盘导航焦点日期
- 记录实例配置项

候选模块：

- [src/state/create-picker-state.js](../src/state/create-picker-state.js)

### 3. View 层

视图渲染层，只负责表现，不承担业务判断。

职责：

- 渲染输入框对应的浮层面板
- 渲染头部、星期栏、日期网格、底部操作区
- 渲染 selected、disabled、today、outside-month 等状态
- 尽可能局部更新 DOM，而不是无差别整体重建

候选模块：

- `src/view/render-panel.js`
- `src/view/render-grid.js`

### 4. Interaction 层

交互编排层，负责 DOM 事件和焦点控制。

职责：

- 管理打开与关闭
- 处理点击、键盘、焦点事件
- 协调输入框输入与选中日期同步
- 在状态变化后驱动重新渲染

候选模块：

- `src/interactions/bind-input-events.js`
- `src/interactions/bind-panel-events.js`
- [src/interactions/keyboard-navigation.js](../src/interactions/keyboard-navigation.js)

### 5. Public API 层

集成边界层，供外部使用。

职责：

- 创建与销毁实例
- 暴露 `open`、`close`、`setValue`、`getValue`、`destroy` 等方法
- 校验 options
- 派发生命周期与变更回调

候选模块：

- [src/date-picker.js](../src/date-picker.js)
- [src/index.js](../src/index.js)

## 实例模型

每一个 input 对应一个 picker 实例。每个实例拥有：

- 自己的 DOM 引用
- 自己的状态对象
- 自己的配置项
- 自己的清理函数集合

实例之间不能互相修改状态。公共工具函数可以复用，但打开状态、可见月份、选中日期等必须严格实例隔离。

## 推荐状态结构

```js
{
  isOpen: false,
  selectedDate: null,
  visibleYear: 2026,
  visibleMonth: 6,
  focusedDate: null,
  inputValue: "",
  options: {
    format: "YYYY-MM-DD",
    locale: "zh-CN",
    minDate: null,
    maxDate: null,
    disabledDates: [],
    allowManualInput: true,
    showToday: true,
    showClear: true
  }
}
```

## 渲染规则

- 可见月份必须由状态驱动，而不是从 DOM 文本反推
- 日期单元格必须基于结构化日历数据生成
- 禁用日期必须有明确的不可交互语义
- 选中日期与键盘焦点日期必须能明显区分
- 面板定位应通过计算完成，不能永久依赖写死的绝对定位

## 可访问性要求

- 输入框打开面板时应暴露 expanded 状态
- 面板应有可访问名称
- 日期网格应支持键盘导航
- 焦点在打开时进入面板，关闭时返回输入框
- 禁用日期不可获得焦点

## 公共 API 方向

推荐的创建方式：

```js
const picker = new DatePicker(input, {
  format: "YYYY-MM-DD",
  locale: "zh-CN",
  minDate: "2026-01-01",
  maxDate: "2026-12-31"
});
```

推荐公开方法：

- `open()`
- `close()`
- `destroy()`
- `getValue()`
- `setValue(value)`
- `setMonth(year, month)`

推荐回调：

- `onOpen`
- `onClose`
- `onChange`
- `onMonthChange`
- `onInputError`

## 测试策略

### 纯逻辑测试

覆盖：

- 月份网格生成
- 闰年行为
- 月份边界切换
- 日期解析与格式化
- 约束判断

### 浏览器回归测试

覆盖：

- 打开与关闭行为
- 多实例隔离
- 手动输入同步
- 键盘交互流程
- 日期选择流程

### 视觉回归测试

在布局稳定后于 v1.0 中后期引入。

覆盖：

- 面板定位
- 选中态与禁用态
- 不同主题表现

## 从当前代码迁移的策略

### 当前状态

- [date.plugin.js](../date.plugin.js) 同时混合了纯日期计算与 DOM 交互
- [date.plugin.ext.js](../date.plugin.ext.js) 暴露手动初始化模式
- demo 页面和回归页当前仍直接依赖浏览器全局对象

### 目标状态

- legacy 文件逐步退化为兼容包装层
- 新的权威实现沉淀在 `src/`
- 纯逻辑可被包装层、未来构建产物和测试复用
- demo 页面最终验证公共 API，而不是内部实现细节

## 不可妥协的质量规则

1. 不新增共享可变全局状态
2. 新行为必须伴随回归覆盖
3. DOM 文本不能作为状态真源
4. 公共 API 改动必须同步更新文档
5. 可访问性不能留到最后一轮再补
