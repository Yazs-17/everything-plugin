/** @internal Logger used by core internals. Not part of public API. */
export const logger = {
  error(msg: string, err?: unknown) {
    console.error(`[PluginCore] ${msg}`, err ?? '');
  },
  warn(msg: string) {
    console.warn(`[PluginCore] ${msg}`);
  },
  info(msg: string) {
    console.log(`[PluginCore] ${msg}`);
  }
};
