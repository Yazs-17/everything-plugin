import { PluginDriver } from "./PluginDriver";
import { definePlugin, PluginBase } from "./PluginBase";
class EnvExecutor {
  pluginDriver = new PluginDriver();
  state: Record<string, any> & { root: HTMLDivElement } = {
    root: document.createElement('div')
  }
  constructor() {
    document.body.append(this.state.root);
    this.pluginDriver.env = this;
  }
  register(plugins: PluginBase[]) {
    this.pluginDriver.batchRegister(plugins);
  }
  start() {
    this.pluginDriver.hookRender('initialize');
    requestAnimationFrame(this.#loop)
  }
  #loop = async () => {
    await this.pluginDriver.hookRender('renderBefore');
    await this.pluginDriver.hookRender('render');
    await this.pluginDriver.hookRender('renderAfter');
    requestAnimationFrame(this.#loop)
  }
}


export {
  EnvExecutor,
};