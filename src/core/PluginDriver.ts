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

  unregister(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        if (typeof plugin.destroy === 'function') {
          plugin.destroy(this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed during unregister cleanup:`, error);
      }
      this.plugins.delete(name);
      console.log(`[PluginDriver: plugin unregistered] ${name}`);
    }
  }

  hookInitialize(hookName: string) {
    this.plugins.forEach((plugin) => {
      try {
        if (typeof plugin[hookName] === 'function') {
          plugin[hookName](this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    })
  }

  async hookRender(hookName: string) {
    const promises = Array.from(this.plugins.values()).map(async (plugin) => {
      try {
        if (typeof plugin[hookName] === 'function') {
          await plugin[hookName](this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    });
    await Promise.all(promises);
  }

  hookDestroy(hookName: string) {
    this.plugins.forEach((plugin) => {
      try {
        if (typeof plugin[hookName] === 'function') {
          plugin[hookName](this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    })
  }

}

export {
  PluginDriver
};