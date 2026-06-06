# date-plugin 浏览器兼容性说明

## 范围

`date-plugin` v1.0 当前面向现代浏览器环境，重点覆盖桌面端与移动端常见的 Chromium、Safari 和 Firefox 版本。

## 推荐兼容基线

- Chrome / Edge：近两年内的稳定版本
- Safari：近两代 macOS / iOS Safari 稳定版本
- Firefox：近两年内的稳定版本

## 依赖的浏览器能力

- 原生 ES Modules
- `classList`、`dataset`、`requestAnimationFrame`
- `matchMedia`
- `aria-*` 属性与基础键盘事件
- `env(safe-area-inset-bottom, 0px)`：
  不支持时会自动回退到 `0px`

## 当前验证方式

- 核心逻辑通过浏览器测试页验证
- 公共 API、options、移动端 sheet、overlay、safe-area 和 reduced-motion 均有独立测试页
- `regression.html` 继续承担跨行为组合回归

## 当前不承诺的环境

- Internet Explorer
- 不支持 ES Modules 的旧浏览器
- 需要 polyfill 才能运行的极旧移动端 WebView

## 已知限制

- 当前仓库还未提供编译后的降级构建产物
- 当前发布对象以源码入口和 legacy 浏览器直引脚本为主
