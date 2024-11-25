import { ObjectProxyHandler } from "./ObjectProxyHandler";
import type { ProxiedValueV2 } from "../../classes/ProxiedValue";
import type { ObservableProxyHandler } from "../../types";
import { unproxify } from "../../utils/unproxify";
import { getHandler } from "./getHandler";
import { cloneArray } from "../../utils/clone/cloneArray";

export class ArrayProxyHandler<T extends Array<any>> extends ObjectProxyHandler<T> implements ObservableProxyHandler<ProxiedValueV2<T>, Array<any>> {
    $newItemsCallback = (target: ProxiedValueV2<T>, bindedTargetProperty: Function) => (...args: T[]) => {
        const proxiedArray = this.getInitialValue(target, unproxify(args));
        const result = bindedTargetProperty(proxiedArray);
        return result;
    }
    $overrides = {
        push: this.$newItemsCallback,
        $replace: this.$newItemsCallback,
        unshift: this.$newItemsCallback,
        fill: (target, bindedTargetProperty: Array<any>['fill']): Array<any>['fill'] => (newValue, start, end) => {
            const result = bindedTargetProperty(
                this.createProxyChild(target, unproxify(newValue)),
                start,
                end,
            );
            return result;
        },
        splice: (target, bindedTargetProperty: Array<any>['splice']): Array<any>['splice'] => (start, deleteCount, ...items) => {
            const result = bindedTargetProperty(
                start,
                deleteCount,
                ...items.map((x) =>
                    this.createProxyChild(target, unproxify(x)),
                ),
            );
            return result;
        }
    }
    apply(target: ProxiedValueV2<T>, _: any, args: any[]) {
        if (args.length > 0) {
            const newValue = unproxify(args[0]);
            if (Array.isArray(newValue)) {
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
    getInitialValue(target: ProxiedValueV2<T>, unproxifiedValue: Array<any>): T {
        return cloneArray(unproxifiedValue, (newValue) =>
            this.createProxyChild(target, newValue),
        ) as unknown as T;
    }
    set(target: ProxiedValueV2<T>, p: string | symbol, newValue: any): boolean {
        return target[p](newValue)
    }
    get(target: ProxiedValueV2<T>, property) {
        if (property in target) return Reflect.get(target, property);
        const targetProperty = Reflect.get(
            target.$value,
            property,
        );
        const bindedTargetProperty =
            typeof targetProperty === "function"
                ? (targetProperty as Function).bind(target.$value)
                : targetProperty;

        return this.$overrides[property]?.(target, bindedTargetProperty) ?? bindedTargetProperty
    }
    // @ts-ignore
    override getOwnPropertyDescriptor(target: ProxiedValueV2<T>, prop: string | symbol) {
        // Otherwise length is listed as a property
        return prop !== "length"
            ? super.getOwnPropertyDescriptor(target, prop)
            : Reflect.getOwnPropertyDescriptor(target, prop);
    }
}