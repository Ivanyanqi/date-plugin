# Changelog

## v1.0.0-beta.2

- 新增 `npm run release:preflight` 发布前自检脚本
- 本机 `node` / `npm` 链路恢复，并完成完整浏览器自动回归验证
- 新增 `package-lock.json`、`.gitignore` 与 beta.2 发布说明
- GitHub Actions 升级为 `npm ci + release:preflight + test:ci`
- 版本检查逻辑继续向当前 `package.json` 版本号收敛

## v1.0.0-beta.1

- 新增 `DatePicker` 模块化公共 API 与 `src/` 目录核心实现
- 保留 legacy 手动初始化与 auto 初始化入口，兼容现有浏览器直引场景
- 补齐日期约束、输入同步、键盘导航、ARIA 语义和月份控制能力
- 支持移动端 bottom-sheet、overlay、锁滚、safe-area 与 reduced-motion
- 补齐发布骨架，包括 `package.json`、`LICENSE`、兼容性说明、发布检查清单和发布说明
- 新增发布流程文档、浏览器自动回归脚本与 GitHub Actions 工作流骨架
