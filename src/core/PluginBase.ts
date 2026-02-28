import { EnvExecutor } from "./Executor";

class PluginBase {
  name: string;
  option: {
    initialize?: (env: EnvExecutor) => unknown;
    initializeEventListener?: (env: EnvExecutor) => (() => void) | void;
    renderBefore?: (env: EnvExecutor) => unknown | Promise<unknown>;
    render?: (env: EnvExecutor) => unknown | Promise<unknown>;
    renderAfter?: (env: EnvExecutor) => unknown | Promise<unknown>;
    destroy?: (env: EnvExecutor) => unknown;
  }
  destroyList = new Set<() => void>();
  constructor(name: string, option: PluginBase['option']) {
    this.name = name;
    this.option = option;
  }

  initialize(env: EnvExecutor) {
    const result = this.option.initialize?.(env);
    const cleanup = this.option.initializeEventListener?.(env);
    if (typeof cleanup === 'function') {
      this.destroyList.add(cleanup);
    }
    return result;
  }

  renderBefore(env: EnvExecutor) {
    return this.option.renderBefore?.(env);
  }

  render(env: EnvExecutor) {
    return this.option.render?.(env);
  }

  renderAfter(env: EnvExecutor) {
    return this.option.renderAfter?.(env);
  }

  destroy(env: EnvExecutor) {
    for (const destroy of this.destroyList) {
      try {
        destroy();
      } catch (error) {
        console.error(`[Plugin Error] ${this.name} failed during cleanup:`, error);
      }
    }
    this.destroyList.clear();
    return this.option.destroy?.(env);
  }
}

const definePlugin = (optionBuilder: () => PluginBase['option'] & { name: string }) => {
  const option = optionBuilder();
  return new PluginBase(option.name, option);
}

export {
  PluginBase,
  definePlugin,
}