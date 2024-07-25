import { ProxiedValue } from "../classes/ProxiedValue";
import { useComputedObserve } from "../hooks/useComputedObserve";
import { useObserve } from "../hooks/useObserve";
import type {
  AnyObject,
  CSSObject,
  UseStyleSheet,
  UseStyleSheetCallback,
} from "../types";
import { bindObservable } from "../utils/bindObservable";
import { formatToKebabCase } from "../utils/formatToKebabCase";
import { getObservables } from "../utils/getObservables";
import { isNil } from "../utils/isNil";
import { unproxify } from "../utils/unproxify";
import { useCssVariables } from "./useCssVariables";

const hostSelectors = [":host", ":host-context"];

const isQuery = (key: string) => key.startsWith("@");

export const hostToText = (
  unproxifiedCssObject: CSSObject,
  parentSelector = "",
): string => {
  const thisRunObjectSelector = {};
  const otherRunsSelectors = Object.entries(unproxifiedCssObject).reduce(
    (previousValue, [key, value]) => {
      if (!isNil(value)) {
        const valueIsObject = typeof value === "object";
        const newKey = formatToKebabCase(key);
        const isQueryResult = isQuery(newKey);
        if (valueIsObject) {
          if (isQueryResult)
            return `${previousValue}${cssObjectToText({
              [newKey]: {
                [parentSelector]: value,
              },
            })}`;

          return `${previousValue}${hostToText(
            value as CSSObject,
            `${parentSelector}${newKey}`,
          )}`;
        }
        thisRunObjectSelector[newKey] = value;
      }
      return previousValue;
    },
    "",
  );
  const thisRunObjectSelectorEntries = Object.entries(thisRunObjectSelector);
  const thisRunSelector =
    thisRunObjectSelectorEntries.length > 0
      ? `${parentSelector}{${thisRunObjectSelectorEntries.reduce(
          (previousValue, [key, value]) => {
            return `${previousValue}${key}:${value};`;
          },
          "",
        )}}`
      : "";

  return `${otherRunsSelectors}${thisRunSelector}`;
};

export function cssObjectToText(
  cssObject: CSSObject,
  isChild?: boolean,
): string {
  const unproxifiedCssObject = unproxify(cssObject);
  let hostRules = "";
  const formattedObject = Object.entries(unproxifiedCssObject).reduce(
    (previousValue, [key, value]) => {
      // & its not working for host
      if (hostSelectors.find((x) => key.startsWith(x))) {
        hostRules = `${hostRules}${hostToText(value as CSSObject, key)}`;
        return previousValue;
      }
      const valueIsObject = typeof value === "object";
      const isQueryResult = isQuery(key);
      const newKey = formatToKebabCase(
        isChild && !isQueryResult && valueIsObject ? `&${key}` : key,
      );
      let newValue;
      let queries = "";

      if (valueIsObject) {
        let valueToStringify;
        // Preudo selectors doesnt support @media inside
        if (key.includes("::")) {
          valueToStringify = {};
          // Separate media from the rest
          Object.entries(value as CSSObject).forEach(([key, value]) => {
            if (key.startsWith("@"))
              queries += `${key}{${newKey}{${cssObjectToText(
                value as CSSObject,
                isChild || !isQueryResult,
              )}}}`;
            else valueToStringify[key] = value;
          });
        } else valueToStringify = value;

        newValue = `{${cssObjectToText(
          valueToStringify as CSSObject,
          isChild || !isQueryResult,
        )}}`;
      } else newValue = `:${value?.toString()};`;

      return `${previousValue}${queries}${newKey}${newValue}`;
    },
    "",
  );
  return `${formattedObject}${hostRules}`;
}

const styleSheetFromCSSObject = (
  getCSSObject: () => CSSObject,
  additionalObservers: any[] = [],
) => {
  const styleSheet = new CSSStyleSheet();
  const observables = getObservables(getCSSObject());
  const stringResult = useComputedObserve(
    () => cssObjectToText(getCSSObject()),
    [...observables, ...additionalObservers],
  );
  bindObservable(stringResult, (formattedObject) => {
    // Jest fix
    if (styleSheet.replaceSync) styleSheet.replaceSync(formattedObject);
  });
  return styleSheet;
};
/**Allows to create a Constructable Stylesheet with a CSSObject */
export const useStyleSheet = ((
  cssObject: UseStyleSheetCallback<AnyObject> | CSSObject,
) => {
  if (typeof cssObject === "function" && !(cssObject instanceof ProxiedValue)) {
    const tags = useObserve(new Set<string>());
    let styleSheet;
    return (tag) => {
      tags.add(tag);
      if (!styleSheet) {
        const cssVariables = useCssVariables<AnyObject>();
        styleSheet = styleSheetFromCSSObject(
          () => cssObject(Array.from(tags).join(","), cssVariables),
          [tags],
        );
      }
      return styleSheet as (tag: string) => CSSStyleSheet;
    };
  }
  return styleSheetFromCSSObject(() => cssObject as CSSObject);
}) as UseStyleSheet;
