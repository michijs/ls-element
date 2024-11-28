import type { ProxiedValue } from "../../classes/ProxiedValue";
import type { ObservableType, ObservableProxyHandler } from "../../types";
import { useComputedObserve } from "../useComputedObserve";

export class FunctionProxyHandler
  implements ObservableProxyHandler<ProxiedValue<Function>, Function>
{
  rootObservableCallback?: () => ObservableType<any>;

  constructor(rootObservableCallback?: () => ObservableType<any>) {
    this.rootObservableCallback = rootObservableCallback;
  }

  apply(target: ProxiedValue<Function>, _, args) {
    // Functions cant change their type - another function was set
    if (args.length === 1 && typeof args[0] === "function") {
      target.$value = args[0];
      return;
    }

    if (this.rootObservableCallback)
      return useComputedObserve(
        () => target.$value(...args),
        [this.rootObservableCallback()],
      );
    else return target.$value(...args);
  }
  get(target: ProxiedValue<Function>, p: string | symbol, receiver) {
    if (p in target) return Reflect.get(target, p, receiver);
    return target.$value[p];
  }
}
