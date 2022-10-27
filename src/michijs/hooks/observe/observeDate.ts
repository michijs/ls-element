import { ObservableObject, ObserveProps } from '../observe';

export const observeDate = <Y>({ item, propertyPath, onChange, subscribeCallback }: ObserveProps<Date, Y>): ObservableObject<Date, Y> => {
  let clone;
  try {
    clone = structuredClone(item);
  } catch {
    clone = new Date(item);
  }
  return new Proxy<Date>(clone, {
    get(target, property) {
      const targetProperty = Reflect.get(target, property);
      if (typeof property === 'string') {
        if (property.startsWith('set')) {
          return function (...args) {
            const oldValue = target.getTime();
            const result = targetProperty.apply(target, args);
            const newValue = target.getTime();
            if (newValue !== oldValue)
              onChange(`${propertyPath}.${property}`);

            return result;
          };

        } else if (property === 'subscribe')
          return (callback) => subscribeCallback?.(propertyPath, callback);
      }
      return typeof targetProperty === 'function' ? targetProperty.bind(target) : targetProperty;
    },
  });
};