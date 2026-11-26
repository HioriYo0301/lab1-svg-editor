# Phase 2 metrics

`node scripts/metrics.mjs` 从 Git 跟踪的源文件生成 `phase2.json`。依赖包、`node_modules` 和构建产物不计入；CLI 按 core、assembly、plugin 分类，VS Code 扩展单列。
