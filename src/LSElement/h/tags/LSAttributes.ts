import { PickWritable, StringKeyOf, IterableAttrs, LSCustomElement } from '../../types';

export type DomInterface<E extends object> = { [K in StringKeyOf<E> as `_${K}`]: E[K] }

export type LSAttributes<E = HTMLElement> = {
    /**
     * Children are created but not updated
     */
    staticChildren?: boolean;
    /**
     * Children are not created or updated. Element creation/update is delegated
     */
    doNotTouchChildren?: boolean;
    // TODO: more docs
    children?: JSX.Element;
    oncreated?: (el: E) => void;
    onupdate?: (jsx: JSX.Element, el: Element, isSVG?: boolean, context?: LSCustomElement) => void
} & Partial<DomInterface<PickWritable<E>>> & IterableAttrs;
