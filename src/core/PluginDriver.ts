import { EnvExecutor } from "./Executor";
import { PluginBase } from "./PluginBase";

class PluginDriver {
  plugins = new Map();
  private pluginArray: PluginBase[] = [];
  env!: EnvExecutor;

  batchRegister(plugins: PluginBase[]) {
    plugins.forEach((plugin) => {
      this.register(plugin.name, plugin);
    })
    console.log("[PluginDriver: plugins registered]", this.plugins);
  }
  register(name: string, plugin: PluginBase) {
    this.plugins.set(name, plugin)
    this.updatePluginArray();
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
      this.updatePluginArray();
      console.log(`[PluginDriver: plugin unregistered] ${name}`);
    }
  }

  private updatePluginArray() {
    this.pluginArray = Array.from(this.plugins.values());
  }

  hookInitialize(hookName: string) {
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      try {
        if (typeof plugin[hookName] === 'function') {
          plugin[hookName](this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    }
  }

  async hookRender(hookName: string) {
    const promises = [];
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      if (typeof plugin[hookName] === 'function') {
        promises.push(
          (async () => {
            try {
              await plugin[hookName](this.env);
            } catch (error) {
              console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
            }
          })()
        );
      }
    }
    await Promise.all(promises);
  }

  hookDestroy(hookName: string) {
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      try {
        if (typeof plugin[hookName] === 'function') {
          plugin[hookName](this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    }
  }
}

export {
  PluginDriver
};