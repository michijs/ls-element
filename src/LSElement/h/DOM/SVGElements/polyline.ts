import { AllAttributes } from "../DOMAttributes/AllAttributes";
import { SVGAriaAttributes, SVGConditionalProcessingAttributes, SVGGenericAttributes, SVGPresentationAttributes } from "../DOMAttributes/SVG";
import { SVGEvents } from "../DOMEvents/SVGEvents";

export type polyline = Partial<
    Pick<AllAttributes, 'points' | 'pathLength'>
    & SVGGenericAttributes
    & SVGConditionalProcessingAttributes
    & SVGEvents
    & SVGPresentationAttributes
    & SVGAriaAttributes
>