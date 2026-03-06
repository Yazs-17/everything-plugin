// Export core types
export interface PluginOption<TEnv> {
  name: string;
  initialize?: (env: TEnv) => unknown | Promise<unknown>;
  initializeEventListener?: (env: TEnv) => (() => void) | void;
  renderBefore?: (env: TEnv) => unknown | Promise<unknown>;
  render?: (env: TEnv) => unknown | Promise<unknown>;
  renderAfter?: (env: TEnv) => unknown | Promise<unknown>;
  destroy?: (env: TEnv) => unknown | Promise<unknown>;
}

export interface PluginBaseInterface<TEnv> {
  name: string;
  option: PluginOption<TEnv>;
  initialize(env: TEnv): unknown;
  renderBefore(env: TEnv): unknown;
  render(env: TEnv): unknown;
  renderAfter(env: TEnv): unknown;
  destroy(env: TEnv): unknown;
}
