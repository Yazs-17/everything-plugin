import type { PluginOption, PluginBaseInterface } from "../types";
import { logger } from "../utils/logger";

export class PluginBase<TEnv> implements PluginBaseInterface<TEnv> {
  name: string;
  option: PluginOption<TEnv>;
  destroyList = new Set<() => void>();

  constructor(name: string, option: PluginOption<TEnv>) {
    this.name = name;
    this.option = option;
  }

  initialize(env: TEnv) {
    const result = this.option.initialize?.(env);
    const cleanup = this.option.initializeEventListener?.(env);
    if (typeof cleanup === "function") {
      this.destroyList.add(cleanup);
    }
    return result;
  }

  renderBefore(env: TEnv) {
    return this.option.renderBefore?.(env);
  }

  render(env: TEnv) {
    return this.option.render?.(env);
  }

  renderAfter(env: TEnv) {
    return this.option.renderAfter?.(env);
  }

  destroy(env: TEnv) {
    for (const destroy of this.destroyList) {
      try {
        destroy();
      } catch (error) {
        logger.error(`${this.name} failed during cleanup.`, error);
      }
    }
    this.destroyList.clear();
    return this.option.destroy?.(env);
  }
}

export function definePlugin<TEnv>(
  optionBuilder: () => PluginOption<TEnv>
): PluginBase<TEnv> {
  const option = optionBuilder();
  return new PluginBase<TEnv>(option.name, option);
}

