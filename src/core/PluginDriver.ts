import { PluginBase } from "./PluginBase";
import { logger } from "../utils/logger";

export class PluginDriver<TEnv> {
  plugins = new Map<string, PluginBase<TEnv>>();
  private pluginArray: PluginBase<TEnv>[] = [];
  env!: TEnv;

  batchRegister(plugins: PluginBase<TEnv>[]) {
    plugins.forEach((plugin) => {
      this.register(plugin.name, plugin);
    });
    logger.info(`[PluginDriver: plugins registered] ${plugins.length}`);
  }

  register(name: string, plugin: PluginBase<TEnv>) {
    this.plugins.set(name, plugin);
    this.updatePluginArray();
  }

  unregister(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        if (typeof plugin.destroy === "function") {
          plugin.destroy(this.env);
        }
      } catch (error) {
        logger.error(`${plugin.name} failed during unregister cleanup:`, error);
      }
      this.plugins.delete(name);
      this.updatePluginArray();
      logger.info(`[PluginDriver: plugin unregistered] ${name}`);
    }
  }

  private updatePluginArray() {
    this.pluginArray = Array.from(this.plugins.values());
  }

  private hookSync(hookName: keyof PluginBase<TEnv>) {
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      try {
        const hook = plugin[hookName];
        if (typeof hook === "function") {
          (hook as Function).call(plugin, this.env);
        }
      } catch (error) {
        logger.error(`${plugin.name} failed at ${hookName}:`, error);
      }
    }
  }

  hookInitialize() {
    this.hookSync("initialize");
  }

  async hookRender(hookName: "renderBefore" | "render" | "renderAfter") {
    const promises = [];
    for (let i = 0; i < this.pluginArray.length; i++) {
      const plugin = this.pluginArray[i];
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        promises.push(
          (async () => {
            try {
              await (hook as Function).call(plugin, this.env);
            } catch (error) {
              logger.error(`${plugin.name} failed at ${hookName}:`, error);
            }
          })()
        );
      }
    }
    await Promise.all(promises);
  }

  hookDestroy() {
    this.hookSync("destroy");
  }
}

