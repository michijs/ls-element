import { useObserve } from "./useObserve";
import type { ObservableType, UseAsyncComputedObserve } from "../types";
import { useWatch } from "./useWatch";
import { CancellablePromise } from "../classes/CancellablePromise";

/**
 * It is used for async computing a value and observing its changes.
 * @param callback A function that returns a promise of type T.
 * @param deps Dependencies to watch for changes.
 * @param initialValue Initial value of type T.
 * @param options An optional object that may contain onBeforeUpdate and onAfterUpdate callback functions.
 * @returns A new observable
 */
export const useAsyncComputedObserve: UseAsyncComputedObserve = (
  callback,
  initialValue,
  deps,
  options,
) => {
  const newObservable = useObserve(initialValue);
  let cancellablePromise: CancellablePromise<any> | undefined;

  const listener = async () => {
    try {
      // Should cancel any update before the last call
      cancellablePromise?.cancel();
      cancellablePromise = new CancellablePromise(
        callback(),
        (callbackResult) => {
          options?.onBeforeUpdate?.();
          (newObservable as ObservableType<object>)(callbackResult as object);
          options?.onAfterUpdate?.();
        },
      );
    } catch (ex) {
      console.error(ex);
    }
  };
  listener();
  useWatch(listener, deps);

  return newObservable;
};
