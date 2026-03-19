import { PluginBase } from "./PluginBase";
import { logger } from "../utils/logger";
import type { LifecycleHookName, RenderHookName, PluginDriverOptions } from "../types";

export class PluginDriver<TEnv> {
  plugins = new Map<string, PluginBase<TEnv>>();
  private pluginArray: PluginBase<TEnv>[] = [];
  private _env: TEnv | null = null;
  private options: Required<PluginDriverOptions>;

  constructor(env?: TEnv, options?: PluginDriverOptions) {
    if (env) this._env = env;
    this.options = {
      debugMode: options?.debugMode ?? false,
      sequential: options?.sequential ?? false,
    };
  }

  get env(): TEnv {
    if (this._env === null) {
      throw new Error("[PluginDriver] env has not been initialized. Call setEnv() or pass env in constructor before dispatching hooks.");
    }
    return this._env;
  }

  set env(value: TEnv) {
    this._env = value;
  }

  batchRegister(plugins: PluginBase<TEnv>[]) {
    plugins.forEach((plugin) => {
      this.register(plugin.name, plugin);
    });
    if (this.options.debugMode) {
      logger.info(`[PluginDriver] plugins registered: ${plugins.map(p => p.name).join(', ')}`);
    }
  }

  register(name: string, plugin: PluginBase<TEnv>) {
    const existing = this.plugins.get(name);
    if (existing) {
      // Destroy old plugin before overwriting to prevent resource leaks
      try {
        existing.destroy(this.env);
      } catch (error) {
        logger.error(`${existing.name} failed during re-register cleanup.`, error);
      }
      if (this.options.debugMode) {
        logger.info(`[PluginDriver] replacing existing plugin: ${name}`);
      }
    }
    this.plugins.set(name, plugin);
    this.updatePluginArray();
  }

  unregister(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        plugin.destroy(this.env);
      } catch (error) {
        logger.error(`${plugin.name} failed during unregister cleanup.`, error);
      }
      this.plugins.delete(name);
      this.updatePluginArray();
      if (this.options.debugMode) {
        logger.info(`[PluginDriver] plugin unregistered: ${name}`);
      }
    }
  }

  private updatePluginArray() {
    const rawPlugins = Array.from(this.plugins.values());

    // Sort by priority first (higher priority = earlier execution)
    rawPlugins.sort((a, b) => b.priority - a.priority);

    // Topological sort based on dependencies
    const resolved = new Set<string>();
    const processing = new Set<string>();
    const sorted: PluginBase<TEnv>[] = [];

    const visit = (plugin: PluginBase<TEnv>) => {
      if (processing.has(plugin.name)) {
        logger.warn(`[PluginDriver] Circular dependency detected involving plugin: ${plugin.name}`);
        return;
      }
      if (resolved.has(plugin.name)) return;

      processing.add(plugin.name);

      for (const dep of plugin.dependencies) {
        const depPlugin = this.plugins.get(dep);
        if (depPlugin) {
          visit(depPlugin);
        } else if (this.options.debugMode) {
          logger.warn(`[PluginDriver] Missing dependency: ${dep} (required by ${plugin.name})`);
        }
      }

      processing.delete(plugin.name);
      resolved.add(plugin.name);
      sorted.push(plugin);
    };

    for (const plugin of rawPlugins) {
      if (!resolved.has(plugin.name)) {
        visit(plugin);
      }
    }

    this.pluginArray = sorted;
  }

  private hookSync(hookName: LifecycleHookName) {
    const env = this.env;
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      try {
        const hook = plugin[hookName];
        if (typeof hook === "function") {
          const result = hook.call(plugin, env);
          // 测试特性：执行阻断 (Bail-out) - 返回 false 则阻断后续插件执行
          if (result === false) {
            if (this.options.debugMode) {
              logger.info(`[PluginDriver] Bail-out at ${hookName} by ${plugin.name}`);
            }
            break;
          }
        }
      } catch (error) {
        logger.error(`${plugin.name} failed at ${hookName}.`, error);
      }
    }
  }

  hookInitialize() {
    this.hookSync("initialize");
  }

  async hookRender(hookName: RenderHookName) {
    const env = this.env;

    if (this.options.sequential) {
      // Sequential mode: run hooks one by one in order
      for (let i = 0; i < this.pluginArray.length; i++) {
        const plugin = this.pluginArray[i];
        const hook = plugin[hookName];
        if (typeof hook === "function") {
          try {
            const result = await hook.call(plugin, env);
            // 测试特性：同步执行支持阻断 (Bail-out) - 返回 false 则阻断并跳过后续所有插件
            if (result === false) {
              if (this.options.debugMode) {
                logger.info(`[PluginDriver] Bail-out at ${hookName} by ${plugin.name}`);
              }
              break;
            }
          } catch (error) {
            logger.error(`${plugin.name} failed at ${hookName}.`, error);
          }
        }
      }
      return;
    }

    // Parallel mode (default): run all hooks concurrently
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        promises.push(
          (async () => {
            try {
              await hook.call(plugin, env);
            } catch (error) {
              logger.error(`${plugin.name} failed at ${hookName}.`, error);
            }
          })()
        );
      }
    }
    await Promise.all(promises);
  }

  // Waterfall hook execution (data flows through plugins)
  async hookWaterfall<TData = any>(hookName: RenderHookName | LifecycleHookName, args: TData): Promise<TData> {
    const env = this.env;
    let currentData = args;

    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        try {
          // Pass currentData alongside env to the hook plugin[hookName](env, currentData)
          // Since the signature of hooks is (env), we might need to change it, or we pass it as a second argument, 
          // but hooks expect (env). Let's pass (env, currentData) allowing users to extend the hook signature.
          const result = await (hook as any).call(plugin, env, currentData);
          
          if (result === false) {
            if (this.options.debugMode) {
              logger.info(`[PluginDriver] Bail-out at ${hookName} by ${plugin.name} in Waterfall`);
            }
            break;
          }
          currentData = result !== undefined ? result : currentData;
        } catch (error) {
          logger.error(`${plugin.name} failed at ${hookName} (Waterfall).`, error);
        }
      }
    }
    return currentData;
  }

  hookDestroy() {
    this.hookSync("destroy");
  }
}

