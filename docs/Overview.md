# Plugin Sys Core 核心架构指南

`plugin-sys-lab` 是一个跨环境（浏览器/Node.js）、强类型、基于生命周期钩子（Hooks）驱动的插件系统核心库。

## 核心特性

- **完全解耦**: 核心机制与具体的框架（Vue/React/NestJS）和环境（前端/后端）完全无关。
- **强类型泛型设计**: 允许使用者自定义注入的上下文（`TEnv`），保证插件内享受 100% 的 TypeScript 类型推导。
- **灵活的生命周期**: 提供 `initialize`、`renderBefore`、`render`、`renderAfter`、`destroy` 等标准化切面。
- **自动资源清理**: 依托内置的 `destroyList` 机制，降低内存泄漏风险。

---

## 架构总览

整个系统被高度抽离为以下三个概念：

1. **`TEnv` (环境上下文)**: 消费者定义的容器，用于存放状态（如 `req/res`，或是前端的 `DOM Element`），并控制生命周期的执行（事件循环或请求管线）。
2. **`PluginDriver<TEnv>` (驱动器)**: 作为总线，负责插件的注册、卸载、以及广播生命周期事件。
3. **`PluginBase<TEnv>` (插件基类)**: 具体的业务切面逻辑。

---

## 快速开始 (以浏览器环境为例)

### 第一步：定义你的环境上下文 (Context)

消费者（接入方）需要自己建立一个包装类，持有一个 `PluginDriver` 实例，并将该环境绑定与抛出生命周期。

```typescript
import { PluginDriver, PluginBase } from 'plugin-sys-core';

export class BrowserEnv {
  public pluginDriver = new PluginDriver<BrowserEnv>();
  public state: Record<string, any> = {}; 
  public container = document.getElementById('app');

  constructor() {
    this.pluginDriver.env = this; // 核心：将自己注入为驱动环境
  }

  // 接管并触发所需生命周期
  start() {
    this.pluginDriver.hookInitialize(); // 触发初始化
    
    // 如果是游戏或编辑器，可以通过 requestAnimationFrame 循环触发生命周期
    const loop = async () => {
      await this.pluginDriver.hookRender('renderBefore');
      await this.pluginDriver.hookRender('render');
      await this.pluginDriver.hookRender('renderAfter');
      requestAnimationFrame(loop);
    };
    loop();
  }

  destroy() {
    this.pluginDriver.hookDestroy();
  }
}
```

### 第二步：编写插件

使用暴露的 `definePlugin` 工厂函数创建纯粹的跨越环境功能的模块：

```typescript
import { definePlugin } from 'plugin-sys-core';

export const ResizePlugin = definePlugin<BrowserEnv>(() => {
  return {
    name: 'resize-plugin',
    
    initializeEventListener(env) {
      const handleResize = () => {
        console.log("Window resized!", env.container);
      };
      window.addEventListener('resize', handleResize);
      
      // 返回一个清理函数，当 env.destroy() 被调用或插件被注销时自动执行
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    },
    
    async render(env) {
      // 这里的 env 推导类型就是 BrowserEnv
      env.state.renderTick = (env.state.renderTick || 0) + 1;
    }
  };
});
```

### 第三步：注册与运行

```typescript
const appEnv = new BrowserEnv();

// 批量注册插件
appEnv.pluginDriver.batchRegister([ResizePlugin]);

// 启动引擎
appEnv.start();
```

---

## 进阶指南

更多的高级用法请参考此目录下的其他文档：

- [后端 NodeJS 接入指南](./NodeJS-Guide.md)
- [API 参考与钩子工作原理](./API-Reference.md)
- [未来架构优化方向](./Optimization.md)
