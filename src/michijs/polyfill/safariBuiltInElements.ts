export const extendedElements: Record<string, [CustomElementConstructor, string]> =
  {};

const originalDefine = window.customElements.define.bind(
  window.customElements,
);

window.customElements.define = (name, constructor, options) => {
  if (options?.extends) {
    extendedElements[name] = [constructor, options.extends];
  } else originalDefine(name, constructor, options);
};

const originalCreateElement = document.createElement.bind(document);

const observer = new MutationObserver((mutationList) => {
  mutationList.forEach((mutation) => {
    switch (mutation.type) {
      case "attributes":
        // @ts-ignore
        mutation.target.attributeChangedCallback(
          mutation.attributeName,
          mutation.oldValue,
          // @ts-ignore
          mutation.target.getAttribute(mutation.attributeName),
        );
    }
  });
});

document.createElement = (
  tagName: string,
  options?: ElementCreationOptions,
) => {
  const newEl = originalCreateElement(tagName, options);

  if (options?.is) {
    const [customElement, customElementTag] = extendedElements[options.is];
    Object.setPrototypeOf(newEl, customElement.prototype);
    newEl.setAttribute("is", customElementTag);

    // @ts-ignore
    newEl.fakeConstructor?.();
    // @ts-ignore
    newEl.connectedCallback?.();
    if (
      // @ts-ignore
      typeof newEl.attributeChangedCallback === "function" &&
      // @ts-ignore
      customElement.observedAttributes
    ) {
      observer.observe(newEl, {
        // @ts-ignore
        attributeFilter: customElement.observedAttributes,
        attributeOldValue: true,
      });
    }
  }

  return newEl;
};
