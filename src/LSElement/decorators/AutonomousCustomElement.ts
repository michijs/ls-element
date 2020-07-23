import { formatToKebabCase } from '../utils/formatToKebabCase';
import type { LSCustomElement } from '../types';
import { executeFirstRender } from '../render/executeFirstRender';
import { initLsStatic } from '../properties/initLsStatic';
import { convertStringToDataType } from '../utils/convertStringToDataType';
import { createGetterAndSetterForObservedAttributes } from '../properties/createGetterAndSetterForObservedAttributes';
import { addEventDispatchers } from '../properties/addEventDispatchers';
import { addElementsReferences } from '../properties/addElementsReferences';
import { addProperties } from '../properties/addProperties';
import { addAttributes } from '../properties/addAttributes';
import { addReduxStores } from '../properties/addReduxStores';

interface AutonomousCustomElementConfig {
	tag?: string;
	shadow?: false | 'open' | 'closed';
}

const validateTag = (tag: string) => {
	if (tag.indexOf('-') <= 0) {
		throw new Error('You need at least 1 dash in the custom element name!');
	}
};

export const AutonomousCustomElement = (config?: AutonomousCustomElementConfig) => (element: CustomElementConstructor) => {
	const tag = config?.tag || formatToKebabCase(element.name);
	validateTag(tag);

	const emptyFunction = () => { };
	const connectedCallback = element.prototype.connectedCallback || emptyFunction;
	const disconnectedCallback = element.prototype.disconnectedCallback || emptyFunction;

	element.prototype.attributeChangedCallback = function (name: string, oldValue, newValue) {
		if (newValue != oldValue) {
			this[name] = convertStringToDataType(newValue);
		}
	};
	
	element.prototype.lsStatic = initLsStatic(element.prototype.lsStatic);

	Object.defineProperty(element.prototype.constructor, 'observedAttributes', createGetterAndSetterForObservedAttributes(element.prototype.lsStatic));

	element.prototype.connectedCallback = function () {
		const self: LSCustomElement = this;
		if (!self.ls?.alreadyConnected) {
			self.ls = {};
			const useShadow = config?.shadow !== false;
			if (useShadow) {
				const shadowMode = config?.shadow || 'open';
				self.attachShadow({ mode: shadowMode });
			}

			addEventDispatchers(self);
			addElementsReferences(self);
			addProperties(self);
			addAttributes(self);
			addReduxStores(self);
			executeFirstRender(self);
			self.ls.alreadyConnected = true;

			//Lifecycle methods
			if (self.componentWillMount) {
				self.componentWillMount();
			}
			connectedCallback.call(self);
			if (self.componentDidMount) {
				self.componentDidMount();
			}
		}
	};

	element.prototype.disconnectedCallback = function () {
		if (this.componentWillUnmount) {
			this.componentWillUnmount();
		}
		disconnectedCallback.call(this);
		if (this.componentDidUnmount) {
			this.componentDidUnmount();
		}
	};

	window.customElements.define(tag, element);
};