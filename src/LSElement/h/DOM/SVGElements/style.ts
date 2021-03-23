import { AllAttributes } from "../DOMAttributes/AllAttributes";
import { SVGGenericAttributes } from "../DOMAttributes/SVG";
import { GetType } from "../DOMAttributes/Utils";
import { SVGEvents } from "../DOMEvents/SVGEvents";

export type style = Partial<
    Pick<AllAttributes, 'media' | 'title'>
    & GetType<'Style'>
    & SVGGenericAttributes
    & SVGEvents
>