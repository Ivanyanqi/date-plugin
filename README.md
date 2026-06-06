# date-plugin
js date plugin

## Development Status

- 当前仓库仍处于 `v1.0` 早期迭代，`index.html` 现已升级为 interactive showcase 首页，`regression.html` 继续承担浏览器回归验证职责
- interactive showcase 首页现在已经包含 capability theater、键盘剧本、移动端验证入口和 `file://` 预览自动跳转兜底
- 新的纯逻辑源码已经开始沉淀到 `src/` 目录，后续会逐步替换 legacy 脚本中的重复实现
- 当前本机 `node` 与 `npm` 链路已经恢复，仓库同时支持本地 CLI 自检与浏览器自动回归
- 仓库已补充 GitHub Actions 浏览器回归工作流，并增加发布前 preflight 自检脚本
- 当前仍以 HTML 测试页和 Playwright 回归作为主验证路径，后续再按需补充更细粒度的 CLI 单元测试
- 后续项目文档、计划和开发说明默认统一使用中文

## 公网展示

- GitHub Pages 展示地址：`https://ivanyanqi.github.io/date-plugin/`
- 首页公网入口默认就是 interactive showcase：首页、能力剧场、快速接入区和测试入口都使用相对路径，适合直接发布为静态站点
- 如果仓库第一次启用 Pages，请在 GitHub 仓库 `Settings -> Pages` 中把 Source 设为 `GitHub Actions`
- 仓库已经提供 `.github/workflows/github-pages.yml`，推送到 `master` 或 `main` 后会自动发布

## 自动初始化

1. 引入 `date.style.css` 和 `date.plugin.js`
2. 为 input 添加 `my-datepicker-box` 类名

```html
<link rel="stylesheet" type="text/css" href="date.style.css">
<script type="text/javascript" src="date.plugin.js"></script>

<input type="text" class="my-datepicker-box">
```

## 模块化公共 API

当前仓库已经提供第一版 `DatePicker` 构造接口，适合在模块化环境中直接使用。

```html
<link rel="stylesheet" type="text/css" href="date.style.css">
<script type="module">
  import { DatePicker } from "./src/index.js";

  const input = document.querySelector("#start");
  const picker = new DatePicker(input, {
    locale: "en-US",
    format: "DD/MM/YYYY",
    defaultValue: "15/08/2026",
    allowManualInput: true,
    closeOnSelect: false,
    showToday: true,
    showClear: true,
    minDate: "2026-08-05",
    maxDate: "2026-08-20",
    disabledDates: ["2026-08-10"],
    onChange(value, meta) {
      console.log("changed:", value, meta.source);
    },
    onMonthChange(payload) {
      console.log("month changed:", payload.source, payload.year, payload.month);
    },
    onInputError(payload) {
      console.log("invalid input:", payload.value);
    }
  });

  await picker.ready;
  await picker.setMonth(2026, 12);
  await picker.open();
  await picker.setValue("16/08/2026");
</script>
```

当前可用的最小公共方法：

- `ready`
- `open()`
- `close()`
- `getValue()`
- `setValue(value)`
- `setMonth(year, month)`
- `destroy()`

当前包导出入口：

- `date-plugin` -> `./src/index.js`
- `date-plugin/styles` -> `./date.style.css`
- `date-plugin/legacy` -> `./date.plugin.ext.js`
- `date-plugin/auto` -> `./date.plugin.js`

当前已经支持的主要配置：

- `locale`
- `format`
- `defaultValue`
- `allowManualInput`
- `closeOnSelect`
- `showToday`
- `showClear`
- `minDate`
- `maxDate`
- `disabledDates`
- `onOpen`
- `onClose`
- `onChange`
- `onMonthChange`
- `onInputError`

当前支持的日期显示格式：

- `YYYY-MM-DD`
- `DD/MM/YYYY`
- `MM/DD/YYYY`

当前内置的星期显示语言：

- `zh-CN`
- `en-US`

推荐在模块化场景里优先等待 `picker.ready`，这样可以确保默认值、初始月份和键盘交互都已经完成初始化。

当前输入同步行为：

- 手动输入合法日期后，会同步可见月份、选中值和键盘焦点
- 手动输入非法日期后，会保留原始文本，并把 input 标记为 `aria-invalid="true"`
- `onChange` 的 `meta.source` 当前会返回 `input`、`select` 或 `api`
- `allowManualInput=false` 时会把 input 设为只读
- `closeOnSelect=false` 时，点击日期后面板会继续保持打开
- `showToday=true` 时会显示“今天 / Today”快捷操作
- `showClear=true` 时会显示“清空 / Clear”快捷操作
- `setMonth(year, month)` 可以在打开前或打开后直接控制当前面板月份
- `onMonthChange` 会在上一月、下一月和 API 控制月份时触发，并返回 `source / year / month`

当前面板样式能力：

- `date.style.css` 已切换为 CSS 变量驱动
- 可通过覆盖 `--dp-panel-width`、`--dp-panel-background`、`--dp-accent` 等变量调整主题
- 打开面板时会自动进行基础视口夹紧，避免右侧空间不足时直接溢出屏幕
- 底部空间不足时，面板会自动翻转到输入框上方，并暴露 `data-placement="top|bottom"`
- 小屏模式下，面板会切换为 bottom-sheet，并暴露 `data-placement="sheet"` 与 `data-mobile="true"`
- 移动端 sheet 打开时会显示遮罩层，并自动锁定 `body` 滚动
- 移动端 sheet 会暴露 `data-open-state="opening|open|closing|closed"`，用于驱动开关动画
- footer 底部会为安全区预留额外空间，默认基于 `env(safe-area-inset-bottom, 0px)`
- 当系统开启 `prefers-reduced-motion: reduce` 时，sheet 会暴露 `data-reduced-motion="true"` 并跳过延迟动画阶段

当前状态视觉钩子：

- 选中日期会附带 `date-plugin-cell-selected` 和 `aria-selected="true"`
- 今天日期会附带 `date-plugin-cell-today` 和 `aria-current="date"`
- 跨月补位日期会附带 `date-plugin-cell-outside` 和 `data-outside="true"`
- 禁用日期会附带 `date-plugin-cell-disabled` 和 `aria-disabled="true"`

当前定位行为：

- 桌面模式会在 `bottom` 和 `top` 之间自动选择可用空间更稳定的一侧
- 移动模式会固定到底部 sheet 布局，不再跟随输入框做浮层式左右定位
- 面板打开后会在窗口 `resize` 和页面 `scroll` 时自动重算位置
- 移动端 sheet 点击遮罩层会直接关闭面板，并恢复页面滚动
- 移动端 sheet 关闭时会先进入 `closing` 状态，再在短动画结束后移除可见层
- reduced-motion 模式下会直接进入 `open` / `closed`，不保留延迟的 opening / closing 过渡

## 手动初始化

1. 引入 `date.style.css` 和 `date.plugin.ext.js`
2. 对需要的 input 调用 `datepickerinit.init(...)`

```html
<link rel="stylesheet" type="text/css" href="date.style.css">
<script type="text/javascript" src="date.plugin.ext.js"></script>

<input type="text" id="start">
<script type="text/javascript">
  datepickerinit.init(document.querySelector("#start"), {
    locale: "zh-CN",
    format: "YYYY-MM-DD",
    defaultValue: "2026-08-15",
    allowManualInput: true,
    closeOnSelect: true,
    showToday: true,
    showClear: true,
    minDate: "2026-08-05",
    maxDate: "2026-08-20",
    disabledDates: ["2026-08-10"]
  });
</script>
```

`index.html` 当前是 interactive showcase 首页，包含真实可玩的日期选择器舞台、能力说明和快速接入区；`regression.html` 用来做浏览器回归检查。
如果直接用 `file:///.../index.html` 打开首页，页面会自动引导回 `http://127.0.0.1:8765/index.html`；如只想保留静态预览，可使用 `?filePreviewStay=1`。
`tests/public/date-picker-api.test.html` 用来验证第一版公共 API。
`tests/public/month-control-api.test.html` 用来验证 `setMonth` 和 `onMonthChange`。
`tests/public/package-manifest.test.html` 用来验证发布入口和发布文档骨架。
`tests/public/showcase-runtime.test.html` 用来验证首页 `file://` 预览兜底和本地交互地址跳转逻辑。
`tests/public/showcase-homepage.test.html` 用来验证 interactive showcase 首页、capability theater、动态接入代码和移动端入口联动。
`tests/options/input-sync-callbacks.test.html` 用来验证输入同步、生命周期回调和行为选项。
`tests/options/footer-actions-positioning.test.html` 用来验证 Today/Clear 操作区与基础面板定位。
`tests/options/visual-states-placement.test.html` 用来验证状态视觉钩子与上下翻转定位语义。
`tests/options/mobile-sheet-layout.test.html` 用来验证移动端 bottom-sheet 模式与操作区布局。
`tests/options/mobile-overlay-scroll-lock.test.html` 用来验证移动端遮罩层、锁滚和遮罩点击关闭。
`tests/options/mobile-animation-safe-area.test.html` 用来验证移动端动画状态和安全区底部留白。
`tests/options/mobile-reduced-motion.test.html` 用来验证系统减少动画偏好下的即时开关行为。

发布相关文档：

- `docs/release-checklist.md`
- `docs/release-process.md`
- `docs/browser-compatibility.md`
- `docs/release-notes-v1.0.0-beta.2.md`
- `CHANGELOG.md`
- `LICENSE`

当前工程化验证入口：

- 本地静态服务：`npm run serve`
- 首页交互预览：`http://127.0.0.1:8765/index.html`
- GitHub Pages 公网预览：`https://ivanyanqi.github.io/date-plugin/`
- 版本准备预演：`npm run release:prepare -- 1.0.0-beta.3 --dry-run`
- GitHub Release 文本导出：`npm run release:notes`
- GitHub Release 命令预演：`npm run release:github`
- 完整发布计划预演：`npm run release:publish`（会输出 remote、upstream、gh 登录和工作区状态）
- 发布前自检：`npm run release:preflight`
- 浏览器自动回归脚本：`npm run test:ci`
- CI 工作流：`.github/workflows/browser-regression.yml`
