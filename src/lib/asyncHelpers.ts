// Executes a 'instantaneous' client side for instant feedback, then executes an asynchronous action.
// If the asynchronous action fails, the instantaneous action is rolled back.
// Usage: instantEffectFnc, rollbackFnc can be async, but the intent is that they execute much quicker (e.g. dexie operations)
export const executeInstantAsyncAction = async (
  instantEffectFnc: (...args: any[]) => any,
  asyncEffectFnc: (...args: any[]) => Promise<any>,
  rollbackFnc: (...args: any[]) => any
) => {
  // Any use for the result of instantEffect?
  let instantEffectResult: any = null;
  if (instantEffectFnc.constructor.name === "AsyncFunction") {
    instantEffectResult = await instantEffectFnc();
  } else {
    instantEffectResult = instantEffectFnc();
  }

  try {
    const asyncEffectResult = await asyncEffectFnc();

    // If error property of result is non-null, rollback
    if (asyncEffectResult && asyncEffectResult.error) {
      if (rollbackFnc.constructor.name === "AsyncFunction") {
        await rollbackFnc();
      } else {
        rollbackFnc();
      }
    }
  } catch (e) {
    // If asyncEffectFnc throws an error, rollback
    if (rollbackFnc.constructor.name === "AsyncFunction") {
      await rollbackFnc();
    } else {
      rollbackFnc();
    }
  }
};
