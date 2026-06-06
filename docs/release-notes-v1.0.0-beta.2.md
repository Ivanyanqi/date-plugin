# date-plugin v1.0.0-beta.2 发布说明

## 发布定位

这是 `date-plugin` 向 v1.0 正式版推进过程中的第二个 beta 版本，重点不是新增大量交互能力，而是把发布前工程化链路真正跑通，让版本发布具备可重复执行的本机自检和 CI 验证能力。

## 本版本包含

- 本机 `node` / `npm` 环境恢复后的完整浏览器自动回归链路
- `npm run release:preflight` 发布前自检脚本
- [package-lock.json](../package-lock.json) 与 [.gitignore](../.gitignore) 工程化收口
- GitHub Actions 升级为 `npm ci + release:preflight + test:ci`
- 版本说明、变更记录和发布检查链路进一步向当前版本号收敛

## 已知限制

- 当前自动回归仍以 HTML 测试页与 Playwright 页面验证为主
- 尚未提供编译后的分发构建目录
- 当前仅接入最小发布前自检与浏览器 CI，尚未接入自动发版流水线

## 下一步建议

- 继续补齐 Git tag / GitHub Release 的标准模板
- 增加版本号升级时的自动同步脚本
- 在正式版前完成文档清理与最终兼容性复核
