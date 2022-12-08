import { CSSObject } from "../types";
import { valueIsCSSObject } from "../typeWards/valueIsCSSObject";
import { formatToKebabCase } from "../utils";

/**
 * returns the list of rules from a css object
 */
export const ruleListFromCssObject = (cssObject: CSSObject, selectors: string[] = []) => {
  const ruleList: string[] = [];
  const ruleDeclarations = Object.entries(cssObject).reduce((previousValue, [key, value]) => {
    if (value !== undefined && value !== null) {
      if (valueIsCSSObject(value)) {
        ruleList.push(...ruleListFromCssObject(value, selectors.concat(key)));
        return previousValue;
      } return `${previousValue}${formatToKebabCase(key)}: ${value};`;
    } else
      return previousValue;
  }, '');

  // If rule is not empty
  if (ruleDeclarations) {
    const indexMedia = selectors.findIndex(x => x.startsWith('@'));
    let endOfTheRule = '}';
    if (indexMedia !== -1 && selectors.length > 1) {
      const selector = selectors[indexMedia];
      const selectorWithBrackets = `${selector}{`;
      if (selector.startsWith('@media')) {
        selectors.splice(indexMedia, 1);
        selectors.unshift(selectorWithBrackets);
      } else {
        selectors.splice(indexMedia, 1, selectorWithBrackets);
      }
      endOfTheRule += '}';
    }
    // Selectors of the rule
    const ruleSelectors = selectors.join('');
    // Rules with @ should be behind other rules
    ruleList.push(`${ruleSelectors}{${ruleDeclarations}${endOfTheRule}`);
  }
  return ruleList;
}