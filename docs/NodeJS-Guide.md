# 后端 Node.js / Server 接入指南

因为 `plugin-sys-core` 的驱动层进行了强效的<泛型解耦>，它不再绑定于浏览器的 `DOM` 或 `requestAnimationFrame`。你完全可以在后端的 **REST API 管线**或**沙箱执行器**中应用这套插件机制。

## 场景 1：HTTP 请求级防注入/数据过滤处理流

在后端，生命周期不是环形的死循环（Loop），而通常是一条**线性的流水线**（Pipeline）。

我们可以将 `TEnv` 视为一次 HTTP Request 的包裹器：

```typescript
import { PluginDriver, definePlugin } from 'plugin-sys-core';

// 1. 定义后端专用上下文
export class RequestPipelineEnv {
  pluginDriver = new PluginDriver<RequestPipelineEnv>();
  req: any;
  res: any;
  state: Record<string, any> = {};

  constructor(req: any, res: any) {
    this.req = req;
    this.res = res;
    this.pluginDriver.env = this;
  }

  // 2. 将 hookRender 映射为管线节点
  async execute() {
    try {
      this.pluginDriver.hookInitialize(); // 资源初始化
      
      // [类似 Express Middleware] 处理、路由权限校验等
      await this.pluginDriver.hookRender('renderBefore'); 
      
      // => [这里执行你的核心控制器/Service 逻辑]
      
      // [类似返回拦截器] 统一处理出参或写 Response Headers
      await this.pluginDriver.hookRender('renderAfter');  
      
    } finally {
      // 一次请求结束必须销毁，否则会导致服务器内存泄漏
      this.pluginDriver.hookDestroy();
    }
  }
}
```

### 编写后端拦截插件

```typescript
export const AuthPlugin = definePlugin<RequestPipelineEnv>(() => ({
  name: 'auth-guard',
  
  // 利用前置管线做 token 鉴权
  async renderBefore(env) {
    const token = env.req.headers['authorization'];
    if (!token) {
      throw new Error('Forbidden'); // 抛出异常可以阻断后续执行
    }
    // 把解析出的用户信息挂载到上下文状态里
    env.state.userId = 'Admin-xxx'; 
  },
  
  // 利用后置管线处理 Headers
  async renderAfter(env) {
    env.res.setHeader('X-Powered-By', 'System-Core');
  }
}));
```

## 场景 2：代码沙箱执行引擎 (如 QuillCode Executor)

如果你的后端要执行用户提交的 Python/JS 代码，也可以把环境定义为一次代码执行沙箱任务：

```typescript
export class CodeSandboxEnv {
  pluginDriver = new PluginDriver<CodeSandboxEnv>();
  code: string;
  output: string = '';

  constructor(code: string) {
    this.code = code;
    this.pluginDriver.env = this;
  }

  async run() {
    this.pluginDriver.hookInitialize();
    
    // 恶意代码检测插件
    await this.pluginDriver.hookRender('renderBefore');
    
    // 实际调用 Docker 运行代码...
    this.output = "Hello World";
    
    // 结果提取、日志上报插件
    await this.pluginDriver.hookRender('renderAfter');
    
    this.pluginDriver.hookDestroy();
  }
}
```