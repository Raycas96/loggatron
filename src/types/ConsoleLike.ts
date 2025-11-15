export interface ConsoleLike {
  log: typeof console.log;
  error: typeof console.error;
  info: typeof console.info;
  warn: typeof console.warn;
  debug: typeof console.debug;
}
