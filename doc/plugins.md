# CLI 插件装配与配置使用

## 启动

在仓库根目录执行（PowerShell 可直接使用，避免 npm 的 --config 参数转发差异）：

```powershell
npm run cli
npm run cli:config
npm run cli:base
```

- cli：方式 A，组合根的代码清单装入 stats、dir、box、box-label、tree-star。
- cli:config：方式 B，读取根目录 plugins.config.json，默认插件顺序与方式 A 完全相同。
- cli:base：读取 plugins.disabled.config.json（空插件数组），只提供阶段一内置能力，不含 stats、dir、box 和树标签。

指定其他配置文件可绕过 npm 参数转发，直接运行：

```powershell
node node_modules/tsx/dist/cli.mjs src/main.ts --config path/to/plugins.config.json
```

配置相对路径以启动时工作目录为准，配置内模块相对路径以配置文件所在目录为准。CLI 进程当前目录是 dir 的目标；read/save 不改变它。dir 的符号链接和特殊项按 `[FILE]` 展示，不递归或访问目标（沿用现有命令策略）。

## 配置格式与接入

```json
{
  "plugins": [
    { "module": "./plugins/stats" },
    { "module": "./plugins/dir", "enabled": true },
    { "module": "some-installed-plugin", "options": { "example": "value" } },
    { "module": "./not-installed", "enabled": false }
  ]
}
```

module 是非空字符串；enabled 缺省为 true；options 是插件自定义的 JSON 值，原样传给 activate。示例 stats/dir/box/标签包目前不解释 options；测试中的自定义插件验证了 options 传递。包名需要在相应 Node 模块查找路径中安装；仓库示例使用相对包目录，不增加外部依赖。

每个包的 package.json 声明 name、type=module、main 和 contributes。例如命令插件声明 `"contributes": { "commands": ["stats"] }`，index.ts 默认导出一个实现 activate 的类实例。插件注册名称与 contributes 必须完全一致，包含类别信息；遗漏类别视为空，不按注册顺序比较名称集合。

方式 A 只在 `src/host/CodeAssembly.ts` 列出具体插件和清单；方式 B 使用 `src/host/PluginLoader.ts` 动态解析模块，不修改它即可新增插件。两者均调用 `PluginLoader.load`，经过暂存、清单比较、冲突预检与发布。包入口位于独立 plugins 子目录，当前封装复用前面阶段的命令/图形类，不复制领域实现。

## 错误与继续启动

- 顶层模块未找到：`error: plugin not found: <module>`。
- 模块无默认导出：`error: plugin has no default export: <module>`。
- 清单与注册不符：`error: plugin manifest mismatch: <name> (declared: …, registered: …)`。
- 激活、模块求值或依赖失败：`error: plugin failed to activate: <name> (<reason>)`。
- 重复名称：`error: duplicate registration: <category>/<name>`，category 为四类清单字段之一。
- 配置 JSON/结构/文件读取不合法：`error: invalid plugin config`，仅以阶段一能力启动。

上述错误不退出 CLI；当前插件暂存注册不发布，先前成功插件保留，继续加载后续项。清单校验的时机和原子性边界见 [ADR-004](adr/004-plugin-loading.md)。

## 验收

```powershell
npm run typecheck
npm test
npm run verify:assembly
git diff --check
```

回放输入、预期输出、SVG 与运行方法见 [transcript](transcript/README.md)。禁用插件后与 final 逐字节比较；三份会话分别覆盖基础命令、box 版本 B、stats 与真实固定目录中的 dir。输出一致证明装配路径一致，不替代 box 领域契约、不变量及属性事务验收。Git 的独立 A/B 接入差异证明仍需后续按老师要求形成普通提交；本次按用户要求不创建任何 commit。
