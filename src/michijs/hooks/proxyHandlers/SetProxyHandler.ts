import { ObjectProxyHandler } from "./ObjectProxyHandler";
import { customMapAndSetClear } from "./customMapAndSetClear";
import type { ProxiedValueV2 } from "../../classes/ProxiedValue";
import { customMapAndSetDelete } from "./customMapAndSetDelete";
import type { ObservableProxyHandler } from "../../types";
import { cloneMap } from "../../utils/clone/cloneMap";
import { unproxify } from "../../utils/unproxify";
import { getHandler } from "./getHandler";

export class SetProxyHandler<T extends Set<any>> extends ObjectProxyHandler<T> implements ObservableProxyHandler<ProxiedValueV2<T>, Set<any>> {
  $overrides = {
    clear: customMapAndSetClear,
    add: (target: ProxiedValueV2<T>, bindedTargetProperty: Map<any, any>['set']): Set<any>['add'] => (newValue) => {
      const unproxifiedValue = unproxify(newValue);
      const hasOldValue = target.$value.has(unproxifiedValue);
      if (!hasOldValue) {
        const observedItem = this.createProxyChild(target, unproxifiedValue);
        bindedTargetProperty(unproxifiedValue, observedItem);
        observedItem.notifyCurrentValue();
      }
      return target.$value;
    },
    delete: customMapAndSetDelete
  }
  apply(target: ProxiedValueV2<T>, _: any, args: any[]) {
    if (args.length > 0) {
      const newValue = unproxify(args[0]);
      if (newValue instanceof Set) {
        target.$value = this.getInitialValue(target, newValue);
        const notifiableObservers = target.notifiableObservers;
        if (notifiableObservers)
          target.notifyCurrentValue(notifiableObservers);
        return;
      } else {
        const newHandler = getHandler(newValue, this.parentSubscription, this.rootObservableCallback);
        target.handler = newHandler;
        return target.handler.apply(target, _, args)
      }
    }
    return target.valueOf();
  }
  getInitialValue(target: ProxiedValueV2<T>, unproxifiedValue: Set<any>): T {
    return cloneMap(unproxifiedValue, (value) =>
      this.createProxyChild(target, value),
    ) as unknown as T;
  }
  set(target: ProxiedValueV2<T>, p: string | symbol, newValue: any): boolean {
    // When setting a new value, call set function
    return this.get(target, 'add')(p, newValue)
  }
  get(target: ProxiedValueV2<T>, p: string | symbol) {
    if (p in target) return Reflect.get(target, p);
    const targetProperty = Reflect.get(
      target.$value,
      p === "add" ? "set" : p,
    );
    const bindedTargetProperty =
      typeof targetProperty === "function"
        ? (targetProperty as Function).bind(target.$value)
        : targetProperty;
    if (p === Symbol.iterator)
      return () => target.$value.values();

    return this.$overrides[p]?.(target, bindedTargetProperty) ?? bindedTargetProperty
  }
}