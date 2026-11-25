# Phase 2 开发计划与验收记录

本轮范围为整理阶段一基线和 VS Code 扩展实践。CLI 插件化按后续节点逐步推进，不提前实现 box。

## 提交节点

1. **整理基线**：只提交原有 README 仓库地址改动；阶段一 typecheck 和 49 项测试通过；保持 final 指向 6808a3b。已提交 e693baa。
2. **VS Code 实践（已完成）**：文件装饰、原生 Outline、异常 XML、启动配置、独立测试、示例、截图、模式分析与复用评估。提交 `feat: add vscode svg decorations and outline`。12 项解析单元测试与真实 VS Code 1.148.0 宿主的六组验收通过，CLI 49 项回归通过；报告、截图与宿主记录统一在 `doc/lab2/`。
3. **框架可扩展**：内核公开 ShapeProvider、Command、TreeDecorator、AttributeHandler，建立统一注册/校验路径；六种内置图形和全部原命令通过装配注册。同步准备公开容器能力、结构不变量、属性事务和读回扩展，确保后续 box 提交不改内核。阶段一回归通过并首次生成 metrics。提交 `refactor: introduce cli extension points`。
4. **命令插件**：独立 stats、dir；DirectoryAccess 和 Node 适配器；替身与真实临时目录测试。提交 `feat: add stats and dir command plugins`。
5. **box 接入**：创建、嵌套、派生 id、必要子部件保护、属性处理、读回降级、失败恢复和一次 set 一个 undo 单元。该接入提交不得修改内核或既有插件。提交 `feat: add box shape and attribute plugins`。
6. **树标签**：modified-star 与 (box) 互不感知；标签状态由实例封装；无标签输出保持阶段一兼容。提交 `feat: add tree decorators for dirty and box labels`。
7. **配置装配**：动态模块解析、contributes 集合校验、重复注册、激活失败的暂存注册回滚；两种装配共用同一路径。安排两个独立演示提交分别证明 A/B 差异约束；同一会话输出逐字节一致。提交 `feat: support code and config plugin assembly`。
8. **收尾**：扩展点代码位置清单、PlantUML 前后依赖图、至少三条 ADR、从 git 历史生成的 CLI 指标、AI 检查修正记录、全部证据。提交 `docs: complete phase 2 report and metrics`。完成验收后才打 p2 并推送，不移动 final 或既有 tag。

## 各节点通用检查

执行根目录 `npm run typecheck`、`npm test`、`git diff --check`。每个节点独立提交；不混入用户其他改动。VS Code 扩展使用自己的依赖和测试，不混入 CLI 指标。

## 基线整理方法

在仓库根检查 `git status --short --branch`、`git diff -- doc/README.md`、`git remote -v` 和 `git rev-parse final`。验证 typecheck、49 项阶段一测试和 diff 检查后，仅 `git add doc/README.md`，以 `docs: add repository link to phase 1 report` 提交。随后检查 `git show --stat HEAD`、工作树以及 final 的提交值。不要使用 `git add .` 混入其他文件，也不要重新打 final tag。

## VS Code 实践验收

原生 Outline 的层级、展开/折叠、点击定位和编辑更新均已实际观察并验证，观察与修正记录在扩展说明中。以真实 Extension Development Host 验证 SVG 文件标记、同名后缀目录不标记、点击源代码定位、编辑更新、不完整 XML 清空与恢复。自动化主机测试在临时工作区编辑，确保磁盘文件字节和文件名不变。

对应源代码、启动步骤、复用评估与截图入口见 `../vscode-extension/README.md`。

## 后续 ADR 候选

- 属性处理器：公开领域上下文；多命中拒绝；事务提交成功才入历史，失败恢复内容和双栈。
- box 读回：缺失插件降级普通 g；部件不合法时拒绝整个读入；重复 id 总是拒绝。
- dirty：内容与保存点比较；祖先传播及新节点规则；按注册顺序拼接标签。
- 插件加载：代码/配置同一暂存注册、校验、原子提交路径；加载器属于宿主装配层。

这些是后续框架实现前需要落实并以测试锁定的设计，当前 VS Code 节点不宣称已实现。
