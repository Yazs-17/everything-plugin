export const logger = {
  error: (msg: string, err?: unknown) => {
    console.error(`[Plugin Core Error] ${msg}`, err || '');
  },
  info: (msg: string) => {
    // only active if debug flag is on, simple version.
    console.log(`[Plugin Core Info] ${msg}`);
  }
};
