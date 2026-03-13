// Hook function signature
export type HookFn<TEnv> = (env: TEnv) => unknown | Promise<unknown>;

// All lifecycle hook names (narrowed type for type-safe dispatch)
export type LifecycleHookName = 'initialize' | 'renderBefore' | 'render' | 'renderAfter' | 'destroy';
export type RenderHookName = 'renderBefore' | 'render' | 'renderAfter';

// Plugin option definition (provided by consumers via definePlugin)
export interface PluginOption<TEnv> {
  priority?: number;
  dependencies?: string[];
  initialize?: (env: TEnv) => unknown | Promise<unknown>;
  initializeEventListener?: (env: TEnv) => (() => void) | void;
  renderBefore?: (env: TEnv) => unknown | Promise<unknown>;
  render?: (env: TEnv) => unknown | Promise<unknown>;
  renderAfter?: (env: TEnv) => unknown | Promise<unknown>;
  destroy?: (env: TEnv) => unknown | Promise<unknown>;
}

// PluginDriver configuration
export interface PluginDriverOptions {
  /** When true, logger.info outputs are enabled. Default: false */
  debugMode?: boolean;
  /** When true, hookRender runs hooks sequentially instead of in parallel. Default: false */
  sequential?: boolean;
}

// Public interface contract for PluginBase
export interface PluginBaseInterface<TEnv> {
  readonly name: string;
  readonly priority: number;
  readonly dependencies: string[];
  initialize(env: TEnv): unknown;
  renderBefore(env: TEnv): unknown;
  render(env: TEnv): unknown;
  renderAfter(env: TEnv): unknown;
  destroy(env: TEnv): unknown;
}
