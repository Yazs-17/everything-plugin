import { PluginDriver } from "./PluginDriver";
import { definePlugin, PluginBase } from "./PluginBase";
class EnvExecutor {
  pluginDriver = new PluginDriver();
  state: Record<string, any> & { root: HTMLDivElement } = {
    root: document.createElement('div')
  }
  #running = false;
  constructor() {
    document.body.append(this.state.root);
    this.pluginDriver.env = this;
  }
  register(plugins: PluginBase[]) {
    this.pluginDriver.batchRegister(plugins);
  }
  start() {
    this.#running = true;
    this.pluginDriver.hookRender('initialize');
    requestAnimationFrame(this.#loop);
  }
  #loop = () => {
    if (!this.#running) return;

    const runFrame = async () => {
      await this.pluginDriver.hookRender('renderBefore');
      await this.pluginDriver.hookRender('render');
      await this.pluginDriver.hookRender('renderAfter');
    };

    runFrame().finally(() => {
      if (this.#running) {
        requestAnimationFrame(this.#loop);
      }
    });
  }
  destroy() {
    this.#running = false;
    this.pluginDriver.hookDestroy('destroy');
  }
}


export {
  EnvExecutor,
};