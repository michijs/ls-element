import {
  Host,
  useStorage,
  EventDispatcher,
  customElement,
  CookieStorage,
} from "@michijs/michijs";
import { counterStyle } from "./shared/counterStyle";

const { count } = useStorage(
  {
    count: 0,
  },
  new CookieStorage({
    // Ten years
    maxAge: 10 * 365 * 24 * 60 * 60,
  }),
);

function decrementCount() {
  count(count() - 1);
}
function incrementCount() {
  count(count() + 1);
}

export const CacheCounter = customElement`cache-counter`({
  events: {
    countChanged: new EventDispatcher<number>(),
  },
  adoptedStyleSheets: { counterStyle },
  render() {
    count.subscribe(this.countChanged);
    return (
      <Host count={count}>
        <button onpointerup={decrementCount}>-</button>
        <span>{count}</span>
        <button onpointerup={incrementCount}>+</button>
      </Host>
    );
  },
});
