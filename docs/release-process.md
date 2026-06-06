# date-plugin 发布流程

## 目标

这份文档用于约束 `date-plugin` 从日常迭代到对外发布的标准动作，避免版本号、文档、回归和发布动作脱节。

## 当前发布策略

- 当前仓库以源码入口发布为主，不生成单独的构建产物目录
- [package.json](../package.json) 的 `exports` 继续暴露 ESM、样式、legacy 手动初始化和 auto 初始化入口
- 浏览器回归页仍是最核心的质量基线
- GitHub Actions 负责执行 preflight + 浏览器自动回归，手工回归负责补充真实交互确认
- GitHub Pages 负责把 interactive showcase 首页发布到公网展示地址 <a href="https://ivanyanqi.github.io/date-plugin/" target="_blank" rel="noreferrer">https://ivanyanqi.github.io/date-plugin/</a>

## 版本推进约定

### beta 阶段

- 用于继续补齐能力、修正文档和稳固测试入口
- 每次 beta 发布都需要更新版本号、发布说明和变更记录

### 正式版前

- 确认 README、兼容性文档、发布说明和检查清单一致
- 确认移动端、桌面端、API 和 legacy 路径均已回归

## 发布前准备

1. 检查 [package.json](../package.json) 中的 `version`、`repository`、`homepage`、`bugs` 与 `exports`
2. 如需切换到新版本，先执行 `npm run release:prepare -- <version> --dry-run`
3. 确认版本准备输出无误后，再执行 `npm run release:prepare -- <version>`
4. 执行 `npm run release:preflight`
5. 完善 `docs/release-notes-<version>.md`，可参考 [docs/release-notes-v1.0.0-beta.2.md](./release-notes-v1.0.0-beta.2.md)
6. 执行 `npm run release:notes`，确认 Release 标题与正文输出符合预期
7. 执行 `npm run release:github`，确认 GitHub Release 命令预演符合预期
8. 执行 `npm run release:publish`，确认完整发布计划预演符合预期
9. 完善 [CHANGELOG.md](../CHANGELOG.md)
10. 如本轮变更影响使用方式，更新 [README.md](../README.md)
11. 检查 [docs/browser-compatibility.md](./browser-compatibility.md) 是否仍与真实支持范围一致

## 自动回归流程

### 本机预检

发布前建议先在本机执行：

1. `npm run release:prepare -- <version> --dry-run`
2. `npm run release:preflight`
3. `npm run release:notes`
4. `npm run release:github`
5. `npm run release:publish`
6. `npm run test:ci`

其中 `release:prepare` 负责预演版本升级会修改哪些文件；`release:preflight` 负责检查元数据、导出入口、关键文档、锁文件和工作流文件是否闭环；`release:notes` 负责导出当前版本的 tag、标题和 release body；`release:github` 负责预演或执行 `gh release create`；`release:publish` 负责把 preflight、notes、回归、tag、push 和 GitHub Release 串成完整发布计划，并输出 remote、upstream、GitHub CLI 登录和工作区状态；`test:ci` 负责逐页执行现有 HTML 回归测试。

### CI 回归

GitHub Actions 工作流 `browser-regression` 会执行以下动作：

1. 拉取仓库代码
2. 基于 [package-lock.json](../package-lock.json) 执行 `npm ci`
3. 执行 `npm run release:preflight`
4. 安装 Playwright 浏览器
5. 启动静态服务
6. 执行浏览器回归脚本
7. 逐页检查各测试页 `#summary` 是否输出 `All checks passed.`

### GitHub Pages 发布

仓库当前提供 [`.github/workflows/github-pages.yml`](../.github/workflows/github-pages.yml) 用于静态发布：

1. 在 `master` 或 `main` 有新提交时自动触发
2. 用 `actions/configure-pages` 准备 Pages 元数据
3. 把仓库根目录下的静态资源整理到 `_site/`
4. 保留 [index.html](../index.html)、样式、`src/`、`docs/`、`tests/`、[regression.html](../regression.html) 和 showcase 运行时文件
5. 写入 `.nojekyll`，避免静态目录被默认 Jekyll 规则过滤
6. 通过 `actions/upload-pages-artifact` 上传静态产物
7. 通过 `actions/deploy-pages` 发布到仓库 Pages 地址

如果仓库第一次启用 GitHub Pages，还需要在仓库 `Settings -> Pages` 中把 Source 设为 `GitHub Actions`。

### 当前回归范围

- [tests/core/calendar.test.html](../tests/core/calendar.test.html)
- [tests/state/instance-state.test.html](../tests/state/instance-state.test.html)
- [tests/interaction/keyboard-navigation.test.html](../tests/interaction/keyboard-navigation.test.html)
- [tests/accessibility/aria-semantics.test.html](../tests/accessibility/aria-semantics.test.html)
- [tests/public/date-picker-api.test.html](../tests/public/date-picker-api.test.html)
- [tests/public/month-control-api.test.html](../tests/public/month-control-api.test.html)
- [tests/public/package-manifest.test.html](../tests/public/package-manifest.test.html)
- [tests/public/showcase-runtime.test.html](../tests/public/showcase-runtime.test.html)
- [tests/public/showcase-homepage.test.html](../tests/public/showcase-homepage.test.html)
- [tests/options/date-constraints.test.html](../tests/options/date-constraints.test.html)
- [tests/options/display-options.test.html](../tests/options/display-options.test.html)
- [tests/options/input-sync-callbacks.test.html](../tests/options/input-sync-callbacks.test.html)
- [tests/options/footer-actions-positioning.test.html](../tests/options/footer-actions-positioning.test.html)
- [tests/options/visual-states-placement.test.html](../tests/options/visual-states-placement.test.html)
- [tests/options/mobile-sheet-layout.test.html](../tests/options/mobile-sheet-layout.test.html)
- [tests/options/mobile-overlay-scroll-lock.test.html](../tests/options/mobile-overlay-scroll-lock.test.html)
- [tests/options/mobile-animation-safe-area.test.html](../tests/options/mobile-animation-safe-area.test.html)
- [tests/options/mobile-reduced-motion.test.html](../tests/options/mobile-reduced-motion.test.html)
- [regression.html](../regression.html)

## 手工回归流程

即使 CI 通过，发布前仍建议手工回归以下路径：

1. 打开 [index.html](../index.html)，检查 interactive showcase 首页首屏、试玩区打开、翻月、选中、关闭行为
2. 确认 capability theater 中的输入同步、约束场景和主题变量动作可以真实触发
3. 如通过 Finder 或其他文件入口打开首页，确认 `file://` 预览会自动引导回本地可交互地址
4. 如本轮涉及公网展示，打开 <a href="https://ivanyanqi.github.io/date-plugin/" target="_blank" rel="noreferrer">https://ivanyanqi.github.io/date-plugin/</a> 确认首页资源和相对路径加载正常
5. 切换移动端视口，检查 sheet、overlay、锁滚和 safe-area
6. 验证 `showToday`、`showClear`、`closeOnSelect`、`allowManualInput`
7. 验证 `setMonth()` 和 `onMonthChange()` 的实际行为
8. 抽样检查一页 public 测试和一页 options 测试，确认浏览器实际渲染没有异常

## 发布执行步骤

1. 更新版本号
2. 如有需要，执行 `npm run release:prepare -- <version>`
3. 更新发布说明与变更记录
4. 本机执行 `npm run release:preflight`
5. 本机执行 `npm run release:notes`
6. 本机执行 `npm run release:github`
7. 本机执行 `npm run release:publish`
8. 本机执行 `npm run test:ci`
9. 完整执行一轮 CI 回归
10. 手工执行一轮发布前回归
11. 确认 `git status` 只包含本次应发布内容
12. 创建发布提交
13. 创建版本 tag
14. 如确认无误，可用 `npm run release:publish -- --execute` 执行完整发布链路
15. 如进入对外分发阶段，再执行 npm 发布或其他分发动作

## 发布后检查

1. 检查仓库 tag 与版本号一致
2. 检查 [README.md](../README.md) 中引用的文档路径有效
3. 检查发布说明中的已知限制仍准确
4. 记录本次发布中暴露出的流程问题，回写到本文件或检查清单

## 当前已知限制

- 当前自动回归基于 HTML 测试页，不等同于完整的 CLI 单元测试体系
- 当前仍未接入自动版本发布和 npm 发布流水线
