# 双装配回放验收

输入文件只包含命令与注释，不含提示符或示例输出。预期输出使用独立的 `*.expected.txt`；`other.svg` 是基础会话依赖的输入文件，不是构建产物。

在仓库根运行：

```powershell
npm run verify:assembly
```

脚本执行以下检查：

1. 相同的基础会话、box 会话和 stats/dir 会话，分别通过代码装配与配置装配启动 CLI。
2. 每份会话使用同一个固定临时工作目录，插件集合与顺序一致，当前所有插件 options 均缺省；输出以 Buffer 逐字节比较。
3. stats/dir 会话只读目录；目录包含两个子目录、隐藏文件、package.json 和 other.svg。两次执行之间比较目录内容，输出保存在进程内而非工作目录，避免日志改变 dir 结果。
4. 从 Git 的不可变 `final` tag 读取阶段一源码到临时目录，以禁用所有可选插件的当前程序回放基础会话，输出须与 final 逐字节一致。不切换分支、不修改 tag、不重置工作树。

`cli-1.expected.txt`、`cli-box.expected.txt`、`cli-commands.expected.txt` 是当前双装配的预期输出；`cli-1.final.expected.txt` 是阶段一 final 的基线输出。脚本默认只读取预期文件，不会自动覆盖它们。首次生成使用维护选项 `node scripts/verify-assembly.mjs --record`，不应将它用作掩盖回归的日常验收命令。

这里验证的是“装配一致”和“基础兼容”，不是自动证明全部实验要求通过。例如之前阶段 box 的文本坐标、完整子部件保护、属性处理器事务仍需独立的领域验收；不能因 A/B 同时产生同一种结果就认定这些领域规则正确。
