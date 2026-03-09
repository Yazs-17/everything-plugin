import { PluginDriver, PluginBase } from "../../../src";

export class EnvExecutor {
  pluginDriver = new PluginDriver<EnvExecutor>();
  state: Record<string, unknown> & { root: HTMLDivElement } = {
    root: document.createElement("div")
  };
  #running = false;

  constructor() {
    document.body.append(this.state.root);
    this.pluginDriver.env = this;
  }

  register(plugins: PluginBase<EnvExecutor>[]) {
    this.pluginDriver.batchRegister(plugins);
  }

  start() {
    this.#running = true;
    this.pluginDriver.hookInitialize();
    requestAnimationFrame(this.#loop);
  }

  #loop = () => {
    if (!this.#running) return;

    const runFrame = async () => {
      if (!this.#running) return;
      await this.pluginDriver.hookRender("renderBefore");
      if (!this.#running) return;
      await this.pluginDriver.hookRender("render");
      if (!this.#running) return;
      await this.pluginDriver.hookRender("renderAfter");
    };

    runFrame().finally(() => {
      if (this.#running) {
        requestAnimationFrame(this.#loop);
      }
    });
  };

  destroy() {
    this.#running = false;
    this.pluginDriver.hookDestroy();
  }
}

