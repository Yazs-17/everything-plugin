import { EnvExecutor } from "./Executor";
import { PluginBase } from "./PluginBase";

class PluginDriver {
  plugins = new Map();
  env!: EnvExecutor;

  batchRegister(plugins: PluginBase[]) {
    plugins.forEach((plugin) => {
      this.register(plugin.name, plugin);
    })
    console.log("[PluginDriver: plugins registered]", this.plugins);
  }
  register(name: string, plugin: PluginBase) {
    this.plugins.set(name, plugin)
  }
  hookInitialize(hookName: string) {
    this.plugins.forEach((plugin) => {
      if (typeof plugin[hookName] === 'function') {
        plugin[hookName](this.env);
      }
    })
  }

  async hookRender(hookName: string) {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin[hookName] === 'function') {
        await plugin[hookName](this.env);
      }
    }
  }

  hookDestroy(hookName: string) {
    this.plugins.forEach((plugin) => {
      if (typeof plugin[hookName] === 'function') {
        plugin[hookName](this.env);
      }
    })
  }

}

export {
  PluginDriver
};