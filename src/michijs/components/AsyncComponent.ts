import { create } from "../DOMDiff/create";
import { jsx } from "../h";
import { VirtualFragment } from "../classes/VirtualFragment";
import type {
  ExtendableComponentWithoutChildren,
  CreateFCResult,
  SingleJSXElement,
  ObservableOrConst,
} from "../types";
import { isObservableType } from "../typeWards/isObservableType";
import { bindObservable } from "../utils/bindObservable";

// Define a type for the return value of promises, which can be a JSX element, a function component, or a DOM element.
type PromiseType<P> =
  | Promise<{ default: P }>
  | Promise<P>
  | (() => Promise<P>)
  | (() => Promise<{ default: P }>);

// Define props for the AsyncComponent.
type AsyncComponentProps<P, T> = ExtendableComponentWithoutChildren<T> & {
  // The promise that resolves to the component to render asynchronously.
  promise: ObservableOrConst<PromiseType<P>>;
  // An optional loading component to display while the async component is loading.
  loadingComponent?: JSX.Element;
  then?(promiseResult: P): JSX.Element;
  catch?(reason: any): JSX.Element;
};

/**
 * Asynchronously renders a component after the promise ends. In the meantime you can choose to show a load component or not show anything.
 */
export const AsyncComponent = <P, const T = CreateFCResult>(
  {
    as: asTag,
    promise,
    loadingComponent,
    catch: errorComponent,
    then,
    ...attrs
  }: AsyncComponentProps<P, T>,
  contextElement?: Element,
  contextNamespace?: string
): Node => {
  const el = asTag
    ? (create({
        jsxTag: asTag,
        attrs,
      } as unknown as SingleJSXElement) as ChildNode & ParentNode)
    : new VirtualFragment();

  // If a loading component is provided, append it to the element.
  if (loadingComponent) el.append(create(loadingComponent, contextElement, contextNamespace));

  // Function to render the component when the promise resolves.
  const render = (promiseResult: P) => {
    const Res = (
      promiseResult &&
      typeof promiseResult === "object" &&
      "default" in promiseResult
        ? promiseResult.default
        : promiseResult
    ) as JSX.Element;

    // Create and replace the element with the resolved component.
    el.replaceChildren(
      create(
        then
          ? then(Res as P)
          : Res && typeof Res === "function"
            ? jsx(Res)
            : Res, contextElement, contextNamespace
      ) as ChildNode & ParentNode,
    );
  };

  // Execute the promise and render the component when it resolves.
  const renderCallback = (p: PromiseType<P>) =>
    (typeof p === "function" ? p() : p)
      .then((res) => render(res))
      .catch((e) => {
        if (errorComponent) {
          render(errorComponent(e) as P);
        } else throw e;
      });

  if (isObservableType(promise)) bindObservable(promise, renderCallback);
  else renderCallback(promise);

  // Return the rendered element.
  return el.valueOf() as Node;
};
