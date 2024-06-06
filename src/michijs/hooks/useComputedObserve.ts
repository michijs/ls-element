import { useObserve } from ".";
import { ProxiedValue } from "../classes";
import type {
  ObservableType,
  UseComputedObserveOptions,
  useWatchDeps,
} from "../types";
import { useWatch } from "./useWatch";

/**
 * It is used for computing a value and observing its changes.
 * @param callback A function that returns a promise of type T.
 * @param deps Dependencies to watch for changes.
 * @param initialValue Initial value of type T. Useful if the callback is a promise
 * @param options An optional object that may contain onBeforeUpdate and onAfterUpdate callback functions.
 * @returns A new observable
 */
export function useComputedObserve<T, Y extends T = T>(
  callback: () => Promise<T> | T,
  deps?: useWatchDeps,
  initialValue?: Y,
  options?: UseComputedObserveOptions,
): ObservableType<
  typeof callback extends Promise<T>
  ? T
  : T extends object
  ? Required<Pick<T, Y extends T ? keyof Y : keyof T>> &
  Omit<T, Y extends T ? keyof Y : keyof T>
  : Y
> {
  const newObservable = useObserve(
    initialValue as typeof callback extends Promise<T>
    ? T
    : T extends object
    ? Required<Pick<T, Y extends T ? keyof Y : keyof T>> &
    Omit<T, Y extends T ? keyof Y : keyof T>
    : Y,
  );

  const listener = () => {
    const callbackResult = callback();
    if (callbackResult instanceof Promise) {
      callbackResult.then((x) => {
        options?.onBeforeUpdate?.();
        (newObservable as ObservableType<object>)(x as object)
        options?.onAfterUpdate?.();
      }
      )
    } else {
      options?.onBeforeUpdate?.();
      (newObservable as ObservableType<object>)(callbackResult as object)
      options?.onAfterUpdate?.();
    }
  };
  listener();
  useWatch(listener, deps);

  return newObservable;
}
