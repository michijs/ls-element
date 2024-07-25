import { hasToJSON } from "../typeWards/hasToJSON";
import type {
  Subscription,
  ObservableType,
  ProxiedValueInterface,
  Typeof,
} from "../types";
import { useComputedObserve } from "../hooks/useComputedObserve";
import { Observable } from "./Observable";
import { deepEqual } from "../utils/deepEqual";
import { unproxify } from "../utils/unproxify";

export class ProxiedValue<T>
  extends Observable<T>
  implements ProxiedValueInterface<T, T>
{
  private $privateValue: T;

  static transactionsInProgress = 0;
  static valuesToNotifyOnTransactionFinish: Set<
    InstanceType<typeof ProxiedValue<any>>
  > = new Set<InstanceType<typeof ProxiedValue<any>>>();
  static startTransaction(): void {
    ProxiedValue.transactionsInProgress++;
  }
  static endTransaction(): void {
    if (ProxiedValue.transactionsInProgress === 1) {
      ProxiedValue.valuesToNotifyOnTransactionFinish.forEach((x) => {
        x.forceNotifyCurrentValue();
      });
      ProxiedValue.valuesToNotifyOnTransactionFinish.clear();
      // Intentionally at the end to avoid notifying twice
    }
    ProxiedValue.transactionsInProgress--;
  }

  constructor(initialValue?: T, initialObservers?: Subscription<T>[]) {
    super(initialObservers);
    this.$privateValue = initialValue!;
    // To avoid issues with isolatedDeclarations
    this[Symbol.toStringTag] = () => this.toString();
    this[Symbol.toPrimitive] = () => this.valueOf();
  }

  set $value(newValue: T) {
    if (this.shouldNotify()) {
      if (!deepEqual(newValue, this.$privateValue)) {
        this.$privateValue = newValue;
        this.notifyCurrentValue();
      }
    } else this.$privateValue = newValue;
  }
  get $value(): T {
    return this.$privateValue;
  }

  notifyCurrentValue(): void {
    if (this.shouldNotify()) {
      if (ProxiedValue.transactionsInProgress > 0)
        ProxiedValue.valuesToNotifyOnTransactionFinish.add(this);
      else this.notify(this.valueOf());
    }
  }
  forceNotifyCurrentValue(): void {
    this.notify(this.valueOf());
  }

  // @ts-ignore
  valueOf(): T {
    // if (typeof this.$value === 'object') {
    //   console.log('pase', this.$value)
    //   throw this.$value
    // }
    return unproxify(this.$value) as T;
  }

  public toObservableString(): ObservableType<string> {
    return useComputedObserve(() => this.toString(), [this]);
  }

  public toBoolean(): boolean {
    return Boolean(this.$value);
  }

  public not(): boolean {
    return !this.$value;
  }

  public is(anotherValue: unknown): boolean {
    return this.$value === anotherValue?.valueOf();
  }

  toJSON(): any {
    if (this.$value && hasToJSON(this.$value)) return this.$value.toJSON();

    return this.$value;
  }

  toString(): string {
    // @ts-ignore
    return this.$value.toString();
  }
  unproxify(): T {
    return this.valueOf();
  }

  shouldNotify(): boolean {
    return !!this.observers;
  }

  typeof(): Typeof {
    return typeof this.$value;
  }

  // Only for jest
  asymmetricMatch(prop: unknown): boolean {
    return this.is(prop);
  }
}