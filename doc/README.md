# 26秋软件设计 README文档

24302010001 莫梓铎

github链接：`https://github.com/HioriYo0301/lab1-svg-editor`

[跳转到 Phase 2 交付说明](#phase-2-delivery)

phase2阶段性提交历史
![alt text](image-2.png)

## 1. 架构方案

### 1.1 模块划分

| 模块 | 目录 | 职责 | 
|---|---|---|
| CLI | `src/cli/` | REPL、Tokenizer、命令注册和文本参数解析；将输入转换为应用调用 | 
| Commands | `src/commands/` | 将一次用户编辑封装为 Command；保存执行所需参数并调用领域对象 | 
| Shapes | `src/shapes/` | `Shape` 类层次、六种图形、Group Composite、ShapeFactory 和 SVG 片段序列化 | 
| Document | `src/document/` | 画布尺寸、根节点、全局 id 索引、父子关系和结构不变量 | 
| History | `src/history/` | undo/redo 双栈、IO 历史屏障 | 
| Parser / Serializer | `src/parser/`、`src/serializer/` | SVG XML 读回与输出；读回时补 id 和报告 warning | 
| IO | `src/io/` | 文件系统抽象和 Node 文件实现，便于测试替换 | 

组件关系如下：

![alt text](image.png)


### 1.2 设计模式的选择与落地

#### Command

代码中的角色映射如下：

| Command 角色 | 本项目 |
|---|---|
| Command | `src/commands/Command.ts` 的 `execute()` / `undo()` |
| ConcreteCommand | `MoveCommand`、`ScaleCommand`、`SetAttributeCommand`、`DeleteCommand`、`GroupCommand`、`UngroupCommand`、`AddToCommand`、`ZOrderCommand` |
| Receiver | `Shape`、`Group`、`SvgDocument` |
| Invoker / Executor | `History`，负责执行命令并维护 undo/redo 栈 |
| Client | `CliApplication`，解析参数并组装具体命令 |

具体命令中保存了请求参数和撤销所需的状态，业务规则由 Shape、Group、SvgDocument 完成。例如 `MoveCommand` 只调用 `shape.move()`；`DeleteCommand` 保存 `ShapePlacement` 以便恢复父节点和原位置。新编辑会清空 redo 栈。

#### Composite

`Group extends Shape`，因此容器和叶子统一支持 `move`、`scale`、`set`、`delete`、序列化和树形显示。Group 保存有序子节点并递归转发操作；`SvgDocument` 维护全局 id 索引和父子结构不变量。

#### Iterator

`Group implements Iterable<Shape>`。`tree`、文档子树收集、Group 的 SVG 序列化以及递归移动/缩放都通过 `for...of` 或 `[...group]` 访问子图形。内部 `childShapes` 由 Group独享并持续维护。

#### Factory

`ShapeFactory` 集中处理类型名到图形类的创建分派：`rect`、`circle`、`ellipse`、`line`、`text`、`g`。


### 1.3 依赖方向规则

依赖方向固定为：

```text
CLI -> Commands -> Document -> Shapes
CLI -> History
CLI -> Parser / Serializer -> Document / Shapes
IO -> Parser / Serializer
Shapes 不依赖 CLI、Commands、History、Parser、Serializer、IO
```

规则及理由：

1. `shapes` 作为核心，不依赖输入形式和外部资源。
2. `document` 只管理画布和图形树，依赖 `shapes`。
3. `commands` 可以调用 `document` 和 `shapes`，隔离业务规则和命令类。
4. `history` 只依赖 Command 接口，通过栈管理生命周期，与图形操作隔离。
5. `parser`、`serializer` 和 `io` 隔离文件格式与外部文件系统。
6. `cli` 位于最外层，负责错误呈现。

## 2. 变化点假设

| 可能变化 | 当前留出的扩展点 |  
|---|---|
| 新增图形类型 | `Shape` 子类 + `ShapeFactory` 注册点 | 
| 新增 CLI 命令 | `Command` 接口、具体命令类和命令注册表 | 
| undo/redo 策略 | `History` 与 `Command.undo()` | 
| SVG 读写实现 | `SvgReader`、`SvgWriter`、`FileSystem` 接口 | 
| 图形树存储结构 | `Group implements Iterable<Shape>` | 
| GUI/Web 入口 | `CliApplication` 之外的入口层 | 

## 3. 过程记录

### 3.1 分步实现

开发按小步提交完成：初始化工程、Shape 层次、Group Composite、文档模型、CLI 解析、基础命令、编辑命令、结构命令、Command 历史、SVG IO。

### 3.2 发现的代表性问题和修正

- `Shape.parent` 最初为 `Shape | null`，文档结构操作需要 Group 的索引能力，随后定位并修改为 `Group | null`。
- `set` 未知属性最初会先尝试解析数值，导致错误信息不符合规格；定位后调整了分派顺序，现在遇到未知属性会先报告 `unknown attribute`。


## 4. 一致性自查

### 4.1 模块划分

实际目录与方案一致：`cli`、`commands`、`document`、`shapes`、`history`、`parser`、`serializer`、`io` 均已建立。测试放在顶层 `test/`，文档放在 `doc/`，与方案相符。

### 4.2 依赖方向

检查结果：Shape 类不导入 CLI、IO 或 History；Document 只依赖 Shape；Command 依赖 Document/Shape；CLI 负责组装 Parser、Serializer、IO 和 History。没有发现违反既定方向的依赖。

### 4.3 阶段边界

`box` 尚未实现，`create box ...` 仍会报告 unknown shape type，Visitor 尚未实现。

## 5. 验收

### 自动化检查

```powershell
npm run typecheck
npm test
```

测试覆盖：图形几何行为、Group 递归操作、id 唯一性、Tokenizer 引号和注释、基础 CLI、编辑&结构命令、undo/redo、IO 历史屏障、SVG round-trip、缺失 id 自动补全。

<a id="phase-2-delivery"></a>

## 6. Phase 2 交付说明

### 6.1 四个扩展点

| 扩展点 | 内核接口与调用位置 | 本阶段实现 | 禁用后的行为 | 契约错误 |
|---|---|---|---|---|
| `ShapeProvider` | `src/plugins/ShapeProvider.ts`；`ShapeFactory.create()`、`fromElement()` | 阶段一图形 provider、`BoxShapeProvider` | 六种阶段一图形仍可用；未装 box 时按普通分组读回 | 重复图形类型或未知类型注册失败 |
| `Command` | `src/plugins/CommandPlugin.ts`；`CliApplication.executeLine()` | 阶段一命令、`StatsCommandPlugin`、`DirCommandPlugin` | 未加载命令返回 `error: unknown command: <name>` | 重复命令名拒绝注册 |
| `TreeDecorator` | `src/plugins/TreeDecorator.ts`；树行渲染流程 | `ModifiedStarDecorator`、`BoxTypeDecorator` | 无 decorator 时使用阶段一原始树输出 | 重复 decorator 名称拒绝注册 |
| `AttributeHandler` | `src/plugins/AttributeHandler.ts`；`SetAttributeCommand` 属性流程 | box 的 `fill`、`label` handler | 未命中时回到阶段一属性白名单 | 冲突注册拒绝，失败修改回滚 |

四个接口注册经过 `PluginContext` 和 `CliApplication.installExtensions()`。

### 6.2 两种装配方式和配置格式

代码装配由 `src/host/CodeAssembly.ts` 在组合根中实例化插件；配置装配由 `src/host/PluginLoader.ts` 读取仓库根的 `plugins.config.json`。两种方式最终进入同一条暂存注册、冲突检查和原子提交路径。

~~~json
{
  "plugins": [
    { "module": "./plugins/box" },
    { "module": "./plugins/stats" },
    { "module": "./plugins/dir", "options": {} },
    { "module": "./plugins/tree-star", "enabled": false }
  ]
}
~~~

配置按数组顺序加载；`enabled: false` 完全跳过；相对路径以配置文件目录为基准；`options` 传给插件的 `activate`。插件通过 `package.json` 的 `contributes` 声明 `shapes`、`commands`、`decorators`、`attributes`。加载器不硬编码具体插件名称或导入映射。

加载失败统一输出并继续启动：

~~~text
error: plugin not found: <module>
error: plugin has no default export: <module>
error: plugin manifest mismatch: <name> (...)
error: plugin failed to activate: <name> (<reason>)
~~~

失败插件的注册先保存在暂存上下文中；manifest 不一致、重复注册或激活异常时撤销该插件的全部暂存注册，保留此前成功的插件。配置结构错误时输出 `error: invalid plugin config`，回到默认内置能力。

### 6.3 `dir` 的目录访问接口与适配器模式

`src/io/DirectoryAccess.ts` 是 Target，描述读取目录并返回直接子项；Node 的 `fs`/`Dirent` 是 Adaptee；`src/io/NodeDirectoryAccess.ts` 是 Adapter；`DirCommandPlugin` 是 Client。命令只依赖 `DirectoryAccess`，所以测试可以注入内存测试替身，也可以使用临时目录验证真实适配器。

### 6.4 A.3 VS Code 职责、模式与复用分析

VS Code 负责扩展生命周期、文档模型、Explorer、Outline、事件分发和结果展示；扩展负责 SVG 判断、轻量解析和结果转换。`extension.activate()` 注册 `FileDecorationProvider` 和 `DocumentSymbolProvider`，之后由 VS Code 分别调用 `provideFileDecoration()` 与 `provideDocumentSymbols()`。

文件标记具有 Decorator 的“附加展示职责”，但不是严格的经典 Decorator：provider 不包装文件对象，而是实现 VS Code 的独立接口并由宿主反向调用。SVG 元素树到 `DocumentSymbol` 的转换属于 Adapter，因为它把内部模型转换为 VS Code 所需模型。阶段一的完整读写解析器面向可编辑模型和完整序列化，不能复用到“不完整 XML”的 Outline；本阶段复用了标签/id 约定、树遍历思路和异常输入测试边界。

### 6.5 架构变化、依赖图和 ADR

重构前，命令表、图形工厂和树渲染器直接知道具体能力；
重构后，内核只依赖扩展点接口和注册表，新增能力通过插件与组合根接入。依赖方向为：

~~~text
领域模型 / 命令执行器 / 树渲染器
              ↑ 只依赖扩展点接口
插件实现 ----> 公开领域抽象
宿主装配 ----> 插件 + PluginContext
配置加载器 --> 模块解析、manifest 校验、装配
~~~

![alt text](image-1.png)
