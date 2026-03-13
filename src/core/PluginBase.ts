import type { PluginOption, PluginBaseInterface } from "../types";
import { logger } from "../utils/logger";

export class PluginBase<TEnv> implements PluginBaseInterface<TEnv> {
  readonly name: string;
  readonly priority: number;
  readonly dependencies: string[];
  /** @internal */
  option: PluginOption<TEnv>;
  /** @internal */
  destroyList = new Set<() => void>();

  constructor(name: string, option: PluginOption<TEnv>) {
    this.name = name;
    this.option = option;
    this.priority = option.priority ?? 0;
    this.dependencies = option.dependencies ?? [];
  }

  initialize(env: TEnv, ...args: any[]) {
    const result = (this.option.initialize as any)?.(env, ...args);
    const cleanup = this.option.initializeEventListener?.(env);
    if (typeof cleanup === "function") {
      this.destroyList.add(cleanup);
    }
    return result;
  }

  renderBefore(env: TEnv, ...args: any[]) {
    return (this.option.renderBefore as any)?.(env, ...args);
  }

  render(env: TEnv, ...args: any[]) {
    return (this.option.render as any)?.(env, ...args);
  }

  renderAfter(env: TEnv, ...args: any[]) {
    return (this.option.renderAfter as any)?.(env, ...args);
  }

  destroy(env: TEnv, ...args: any[]) {
    for (const cleanup of this.destroyList) {
      try {
        cleanup();
      } catch (error) {
        logger.error(`${this.name} failed during cleanup.`, error);
      }
    }
    this.destroyList.clear();
    try {
      return this.option.destroy?.(env);
    } catch (error) {
      logger.error(`${this.name} failed during destroy hook.`, error);
    }
  }
}

export function definePlugin<TEnv>(
  name: string,
  optionBuilder: () => PluginOption<TEnv>
): PluginBase<TEnv> {
  const option = optionBuilder();
  return new PluginBase<TEnv>(name, option);
}

