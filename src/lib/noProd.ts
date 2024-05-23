// a library that provides utilities that only work when the environment is not production

/**
 * Run a function only when the environment is not production
 * @param fn the function to run
 * @returns the return value of the function
 * @example
 * ```typescript
 * runNotProd(() => {
 *   // code that you only want to run when the environment is not production
 * });
 * ```
 */
function runNotProd<T>(fn: () => T): T | undefined {
  if (process.env.NODE_ENV !== "production") {
    return fn();
  }
}

/**
 * Log a message only when the environment is not production
 * @param message the message to log
 * @param optionalParams optional parameters to log
 * @returns undefined
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lg(message?: any, ...optionalParams: any[]) {
  runNotProd(() => {
    console.log(message, ...optionalParams);
  });
}

export { lg, runNotProd };
