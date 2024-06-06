import type {
  ObservableType,
  FetchResult,
  UsePromiseOptions,
  useWatchDeps,
  PromiseResult,
  UseComputedObserveOptions,
} from "../types";
import { useComputedObserve } from "./useComputedObserve";
import { useObserve } from "./useObserve";

/**
 * Ues a promise and allows to manage the result as an observable.
 *
 * @param promise The operation.
 * @param deps Dependencies to watch for changes.
 * @param options An optional object that may contain shouldWait callback function.
 * @returns An Observable that emits the result of the promise operation.
 * @template R Type of the expected response data.
 */
export const usePromise = <R>(
  promise: () => Promise<R>,
  deps?: useWatchDeps,
  options?: UsePromiseOptions,
  computedObserveOptions?: UseComputedObserveOptions
): ObservableType<PromiseResult<R>> => {
  let resolveOut: (value: R | PromiseLike<R>) => void;
  let rejectOut: (reason: any) => void;
  const internalPromise = new Promise<R>((resolve, reject) => {
    resolveOut = resolve;
    rejectOut = reject;
  });
  const initialPromiseValue = {
    loading: true,
    promise: internalPromise,
  } as const;
  const recalls = useObserve(0);
  const recall = () => recalls(recalls() + 1);
  const result = useComputedObserve<FetchResult<R>, typeof initialPromiseValue>(
    async () => {
      if (!options?.shouldWait?.()) {
        try {
          const result = await promise();
          resolveOut(result);
          return {
            loading: false,
            result,
            promise: internalPromise,
            recall,
          };
        } catch (ex) {
          console.error(ex);
          rejectOut(ex);
          return {
            error: new Error(ex),
            loading: false,
            promise: internalPromise,
            recall,
          };
        }
      } else return initialPromiseValue;
    },
    [...(deps ?? []), recalls],
    initialPromiseValue,
    computedObserveOptions
  );

  return result;
};
