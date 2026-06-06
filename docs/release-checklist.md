# date-plugin 发布检查清单

## 目标

这份清单用于把当前仓库从“开发中的日期选择器”推进到“可以对外发布的 v1.0 包”。它重点覆盖兼容性、QA、包结构和发布动作，避免只完成代码而遗漏交付动作。

## 兼容性

- 确认桌面端现代浏览器的核心路径可用
- 确认移动端 sheet、遮罩层、锁滚和 reduced-motion 路径可用
- 确认 `DatePicker` 模块化接入方式与 `date.plugin.ext.js` legacy 方式都可用
- 确认 `date.style.css` 在默认主题下不依赖外部 CSS reset
- 检查 `docs/browser-compatibility.md` 与当前真实支持范围一致

## QA

- 如准备切换版本，先执行 `npm run release:prepare -- <version> --dry-run`
- 本机执行 `npm run release:preflight`
- 本机执行 `npm run release:notes`
- 本机执行 `npm run release:github`
- 本机执行 `npm run release:publish`
- 本机执行 `npm run test:ci`
- 检查 GitHub Actions `browser-regression` 最近一次执行状态
- 逐页回归 `tests/core/*.html`
- 逐页回归 `tests/public/*.html`
- 逐页回归 `tests/options/*.html`
- 回归 `regression.html`
- 手动打开 `index.html`，检查 interactive showcase 首页、capability theater 与试玩区行为
- 如从 `file://` 打开首页，确认页面会自动跳回 `http://127.0.0.1:8765/index.html`

## 包结构

- 检查 `package.json` 的 `name`、`version`、`type` 和 `exports`
- 检查 `license`、`repository` 和 `LICENSE` 文件
- 检查 `files` 白名单只包含需要发布的入口与文档
- 检查 `README.md` 中的 API、配置项和测试入口与真实实现一致
- 检查 legacy 入口、样式入口和 ESM 入口都能从仓库根路径访问

## 发布

- 确认当前版本号符合本次发布阶段
- 汇总本次发布变更摘要与已知限制
- 检查 `CHANGELOG.md`
- 检查 `docs/release-notes-<当前版本>.md`
- 检查 `docs/release-process.md`
- 在最终发布前重新执行一轮完整浏览器回归
- 如需对外分发，再补充许可证、仓库地址和 npm 发布命令

## 当前已知限制

- 当前仓库仍未接入构建产物生成流程，发布对象以源码入口为主
- CI 当前基于 Playwright + 静态服务串联 HTML 测试页，尚未演进为独立 CLI 单元测试体系
