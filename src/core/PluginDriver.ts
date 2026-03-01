import { EnvExecutor } from "./Executor";
import { PluginBase } from "./PluginBase";

class PluginDriver {
  plugins = new Map<string, PluginBase>();
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

  private hookSync(hookName: keyof PluginBase) {
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      try {
        const hook = plugin[hookName];
        if (typeof hook === 'function') {
          (hook as Function).call(plugin, this.env);
        }
      } catch (error) {
        console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
      }
    }
  }

  hookInitialize(hookName: keyof PluginBase) {
    this.hookSync(hookName);
  }

  async hookRender(hookName: keyof PluginBase) {
    const promises = [];
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        promises.push(
          (async () => {
            try {
              await (hook as Function).call(plugin, this.env);
            } catch (error) {
              console.error(`[Plugin Error] ${plugin.name} failed at ${hookName}:`, error);
            }
          })()
        );
      }
    }
    await Promise.all(promises);
  }

  hookDestroy(hookName: keyof PluginBase) {
    this.hookSync(hookName);
  }
}

export {
  PluginDriver
};