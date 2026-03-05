 plugin-sys-lab

to build a lite plugin sys

overall, it use the lifecycle architecture

the forward-looking of the future files structures:
```bash
plugin-core/                  # 独立核心库包名
  ├── src/                    # 源码目录
  │   ├── core/               # 核心逻辑 (PluginDriver, Executor)
  │   ├── types/              # 全局/公共的 TypeScript 类型定义 (PluginBase.ts 中的接口)
  │   ├── utils/              # 内部工具函数 (如 logger, 类型检查器, 错误包装器等)
  │   ├── config/             # 框架的默认配置定义 (非业务私有配置)
  │   ├── index.ts            # 统一导出入口 (Export API 供外部使用)
  ├── __tests__/              # 单元测试 (Jest / Vitest)
  ├── examples/               # (可选) 存放几个 demo 插件，比如 click.plugin.ts
  ├── dist/                   # 编译产物 (通过 tsup / rollup 构建)
  ├── package.json
c  └── README.md
```