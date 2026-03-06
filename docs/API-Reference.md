# 核心 API 与钩子原理

## `definePlugin<TEnv>(factory)`

官方推荐的插件创建形式，保证类型推导与闭包的纯洁性。

- **`TEnv`**: 你的环境泛型类型。
- **返回值**: `PluginBase` 对象。

```typescript
const MyPlugin = definePlugin<MyEnv>(() => {
  // 可以在这里设置闭包内局部变量
  let frameCount = 0; 
  return {
    name: 'plugin-name',
    // ... hooks
  }
});
```

---

## 生命周期 Hooks 解析

| Hook 名称 | 执行类型 | 推荐使用场景 | 特性 |
| :--- | :--- | :--- | :--- |
| `initialize` | 同步 | 数据变量初始化，DOM 静态挂载。 | 只在环境启动时被 `hookInitialize()` 触发 **1次**。 |
| `initializeEventListener` | 同步 (需返回值) | 绑定事件监听 (Event Target / Window)。 | **必须**返回一个 `() => void` 的函数，驱动层会将其收集进 `destroyList` 中用于自动清理。 |
| `renderBefore` | 异步支持 | 在主渲染或核心处理逻辑前。 | 适合做前置数据加工、权限校验、前置副作用。 |
| `render` | 异步支持 | 核心渲染逻辑。 | 承载重活的主场。 |
| `renderAfter` | 异步支持 | 在主渲染完成后执行。 | 适合做清理、数据校验、上报。 |
| `destroy` | 同步 | 主动终止。 | 系统级消亡，由 `hookDestroy()` 触发 **1次**。 |

---

## 异常隔离 (Error Boundary)

`PluginDriver` 内部包含针对单个插件出错的保护机制。
如果 `PluginA` 在 `render` 中抛出异常（`throw new Error(...)`），**不会**导致整个环境 `Env` 崩溃或 `PluginB` 停止执行。

错误会被捕获并输出到 `logger.error` 控制台中。
*（详见 `PluginDriver.ts` 中的 `try...catch` 实现）。*