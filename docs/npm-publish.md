
# 发布到 npm

the files structures:
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
  └── README.md
```

### 1. 本地构建
确保将 TypeScript 源码编译为 JavaScript 产物：
```bash
# 安装依赖（如果尚未安装）
pnpm install

# 运行构建命令
pnpm run build:lib
```
*这将会生成包含产物的 `dist` 目录。*

### 2. 登录 NPM
确保拥有 [npm](https://www.npmjs.com/) 账号，并且在本地终端登录：
```bash
npm login
```
### 3. 发布 NPM 包
由于本项目的包名使用了作用域（即 `@yazs/everything-plugin`），默认情况下 npm 会认为这是一个私有包。为了免费发布为公开包，使用 `--access public` 参数：
```bash
# 发布公开包
npm publish --access public
```

每次更新代码后，记得修改 `package.json` 中的 `version` 字段，然后再重新执行一次 `pnpm run build:lib` 和 `npm publish --access public` 即可。

### 常见发包问题：Public registration is not allowed
切源:
```bash
npm config set registry https://registry.npmjs.org/
```
然后重新执行 `npm login` 和发布命令

### 常见发包问题：Two-factor authentication is required to publish packages
出现这个报错（`npm error 403 Forbidden ... Two-factor authentication... is required`），意味着在 npm 官网为账号开启了 **双因素认证（2FA）**。

因此在执行发布操作时，npm 必须验证动态验证码（OTP）。如果终端没有自动弹出输入验证码的提示，可以手动将验证码附加在发布命令的后面：
```bash
npm publish --access public --otp=123456
```
*(请将 `123456` 替换为手机上的 Google Authenticator、Authy 或其他验证器 App 中此刻对应 npm 的 6 位数字验证码)*

#### 使用 Access Token 自动发布（推荐用于 CI/CD）
```bash
npm config set //registry.npmjs.org/:_authToken="你的npm_xxxx token"; npm publish --access public
```
> 生成 Token 时，必须选择 **Granular Access Token** 并在创建页面的底部勾选 **"Bypass two-factor authentication rules"**（绕过双因素验证），否则报 403 