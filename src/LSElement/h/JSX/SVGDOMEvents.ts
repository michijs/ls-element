export interface SVGDOMEvents extends Omit<Partial<SVGElementEventMap & DocumentAndElementEventHandlers>, 'addEventListener' | 'removeEventListener'> { };