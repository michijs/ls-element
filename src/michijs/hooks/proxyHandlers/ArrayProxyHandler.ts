import { ObjectProxyHandler } from "./ObjectProxyHandler";
import { ProxiedArray } from "../../classes/ProxiedArray";
import type { ProxiedValue } from "../../classes/ProxiedValue";
import type { ObservableProxyHandler } from "../../types";
import { unproxify } from "../../utils/unproxify";
import { cloneArray } from "../../utils/clone/cloneArray";

export class ArrayProxyHandler<T extends ProxiedArray<any>>
  extends ObjectProxyHandler<T>
  implements ObservableProxyHandler<ProxiedValue<T>, Array<any>>
{
  $newItemsCallback =
    (target: ProxiedValue<T>, bindedTargetProperty: Function) =>
    (...args: T[]) => {
      const proxiedArray = this.$cloneAndProxify(target, unproxify(args));
      const result = bindedTargetProperty(...proxiedArray);
      target.notifyCurrentValue();
      return result;
    };
  $callAndNotifyIfTrueCallback =
    (target: ProxiedValue<T>, bindedTargetProperty: Function) =>
    (...args: T[]) => {
      const result = bindedTargetProperty(...args);
      if (result) target.notifyCurrentValue();
      return result;
    };
  $callAndNotifyIfLengthChangedCallback =
    (target: ProxiedValue<T>, bindedTargetProperty: Function) =>
    (...args: T[]) => {
      const oldLength = target.$value.length;
      const result = bindedTargetProperty(...args);
      if (oldLength !== target.$value.length) target.notifyCurrentValue();
      return result;
    };
  $overrides = {
    push: this.$newItemsCallback,
    $replace: this.$newItemsCallback,
    unshift: this.$newItemsCallback,
    fill:
      (target, bindedTargetProperty: Array<any>["fill"]): Array<any>["fill"] =>
      (newValue, start, end) => {
        const result = bindedTargetProperty(
          this.createProxyChild(target, unproxify(newValue)),
          start,
          end,
        );
        target.notifyCurrentValue();
        return result;
      },
    splice:
      (
        target,
        bindedTargetProperty: Array<any>["splice"],
      ): Array<any>["splice"] =>
      (start, deleteCount, ...items) => {
        const result = bindedTargetProperty(
          start,
          deleteCount,
          ...items.map((x) => this.createProxyChild(target, unproxify(x))),
        );
        if (deleteCount > 0 || items.length > 0) target.notifyCurrentValue();
        return result;
      },
    $clear: (target: ProxiedValue<T>, bindedTargetProperty: Function) => () => {
      if (target.$value.length > 0) {
        bindedTargetProperty();
        target.notifyCurrentValue();
      }
    },
    $remove: this.$callAndNotifyIfLengthChangedCallback,
    $swap: this.$callAndNotifyIfTrueCallback,
    pop: this.$callAndNotifyIfTrueCallback,
    reverse: this.$callAndNotifyIfTrueCallback,
    shift: this.$callAndNotifyIfTrueCallback,
    sort: this.$callAndNotifyIfTrueCallback,
  };
  apply(target: ProxiedValue<T>, _: any, args: any[]) {
    if (args.length > 0) return this.applyNewValue(target, unproxify(args[0]));
    return target.valueOf();
  }
  applyNewValue(target: ProxiedValue<T>, unproxifiedValue: T) {
    if (Array.isArray(unproxifiedValue)) {
      this.$overrides.$replace(
        target,
        target.$value.$replace.bind(target.$value),
      )(...unproxifiedValue);
      return;
    } else return this.updateHandlerAndValue(target, unproxifiedValue);
  }
  getInitialValue(target: ProxiedValue<T>, unproxifiedValue: Array<any>): T {
    return new ProxiedArray(
      ...this.$cloneAndProxify(target, unproxifiedValue),
    ) as unknown as T;
  }
  $cloneAndProxify(target: ProxiedValue<T>, unproxifiedValue: Array<any>) {
    return cloneArray(unproxifiedValue, (newValue) =>
      this.createProxyChild(target, newValue),
    );
  }
  get(target: ProxiedValue<T>, property) {
    if (property in target) return Reflect.get(target, property);
    const targetProperty = Reflect.get(target.$value, property);
    const bindedTargetProperty =
      typeof targetProperty === "function"
        ? (targetProperty as Function).bind(target.$value)
        : targetProperty;

    return (
      this.$overrides[property]?.(target, bindedTargetProperty) ??
      bindedTargetProperty
    );
  }
  // @ts-ignore
  override getOwnPropertyDescriptor(target, prop) {
    // Otherwise length is listed as a property
    return prop !== "length"
      ? super.getOwnPropertyDescriptor(target, prop)
      : Reflect.getOwnPropertyDescriptor(target, prop);
  }

  override ownKeys(target: ProxiedValue<T>) {
    return Reflect.ownKeys(target.$value).filter((x) => x !== "List");
  }
}
