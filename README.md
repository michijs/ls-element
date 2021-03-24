# LS-Element: A Vainilla Library for Web Components
![npm][github-version] [![license][github-license]][github-license-url] ![npm][npm-downloads] ![npm][repo-size]

## Why "LS-Element?"

If you want a library that:

- Do NOT uses Virtual-DOM

- Uses standard APIs to build web components

- Can use stores like [Redux](https://redux.js.org/introduction/getting-started)

- Uses [TypeScript](https://www.typescriptlang.org) for typing

- Uses [JSX](https://es.reactjs.org/docs/introducing-jsx.html) as template language

- Uses [esbuild](https://esbuild.github.io/) as default bundler

- Is reactive

- Uses decorators to keep your code clean and easy 

- Without polyfills

- Uses [KISS](https://en.wikipedia.org/wiki/KISS_principle) as a principal pattern

- Has support for [Constructable Stylesheets](https://developers.google.com/web/updates/2019/02/constructable-stylesheets)

- Can have children's without Shadow DOM (using attributes)

This library is for you.

## Getting Started

You can use [this template](https://github.com/lsegurado/ls-element-template) or you can see on [Code Sandbox](https://codesandbox.io/s/github/lsegurado/ls-element-template/tree/master/?file=/src/components/RootComponent/index.tsx).
  
## Creating components

LS Element custom elements are plain ES6/TypeScript classes with some decorator metadata.

New components can be created using the `.tsx` extension, such as `MyCounter.tsx`.

```tsx
import { AutonomousCustomElement, Observer, h, EventDispatcher, CustomEventDispatcher, LSCustomElement, HTMLAttributes, Attribute, CustomElementWrapper, AdoptedStyle } from '@lsegurado/ls-element';
import style from './index.css';

@AutonomousCustomElement()
export class MyCounter extends HTMLElement implements LSCustomElement {
	@Attribute() count = 0;
	@EventDispatcher() countChanged: CustomEventDispatcher<number>;

	@Observer('count')
	onCountChanged(newValue: number, _oldValue: number) {
	  this.countChanged.dispatch(newValue);
	}

	decrementCount(){
	  this.count--;
	}

	incrementCount(){
	  this.count++;
	}

	render() {
	  return (
	    <>
	      <AdoptedStyle parentRef={this} id="style">{style}</AdoptedStyle>
	      <button id="decrement-count" onpointerup={this.decrementCount}>-</button>
	      <span id="count">{this.count}</span>
	      <button id="increment-count" onpointerup={this.incrementCount}>+</button>
	    </>
	  );
	}
}

type CounterAttributes = {
	oncountchanged?: (event: CustomEvent<number>) => void;
} & HTMLAttributes;

export default CustomElementWrapper<CounterAttributes>(MyCounter);
```

Note: the `.tsx` extension is required, as this is the standard for TypeScript classes that use JSX.

To use this component, just use it like any other HTML element:

```tsx
import '../Counter';

<my-counter id="my-counter" oncountchanged={(ev) => console.log(`New count value: ${ev.detail}`)} />
```

Or if you are using jsx
```tsx
import Counter from '../Counter';

<Counter id="my-counter" oncountchanged={(ev) => console.log(`New count value: ${ev.detail}`)} />
```
  
Please note that all elements included in the components in this library require an ID to work properly. This allows avoiding the use of the virtual DOM.

## How this works? 
When you update an item, the library looks for your changes and only updates the attributes / children / etc that really changed (similar to how the virtual DOM works). By forcing the use of IDs it is easy to find changes and update them without replacing nodes in the DOM and without using the virtual DOM.

### But... Wait, DOM elements shouldn't be unique?
  
In this case I am going to quote Eric Bidelman, a Google engineer on [this topic](https://developers.google.com/web/fundamentals/web-components/shadowdom):
*For example, when you use a new HTML id/class, there's no telling if it will conflict with an existing name used by the page.*
That is to say that while it is inside the Shadow DOM you should not worry about if your ID is repeated with one outside the Shadow DOM.

### Why not use keys like React?
Searching with IDs is so much faster than searching by queryselector. You can look at [this topic](https://measurethat.net/Embed?id=99697) and [this another](http://vanilla-js.com)

### But... What if I don't want to use Shadow DOM?
You can import IdGenerator class to create unique IDs for each element in your component. 
```tsx
idGen = new IdGenerator();
    
render() {
    return (
        <>
            <style {...this.idGen.get('style')}>{style}</style>
            <button {...this.idGen.get('decrement-count')} onpointerup={this.decrementCount}>-</button>
        </>
    );
}
```
This class will use [uuid](https://github.com/uuidjs/uuid) to generate an ID with the key gived. The result will be like this:

```html
<style id="093dc6b7-315d-43c1-86ef-fcd49130ea32"></style>
<button id="c8d61264-45ee-42ce-9f74-1d76402d1f48">-</button>
```

## Decorators
If you are not familiar with decorators please check [this link](https://www.typescriptlang.org/docs/handbook/decorators.html).

### Class Decorators

| Decorator | Description  |
|--|--|
| `@AutonomousCustomElement()` | Indicate a class is a [Autonomous custom element](https://developers.google.com/web/fundamentals/web-components/customelements#shadowdom). By default uses Shadow DOM. |
| `@CustomizedBuiltInElement()` | Indicate a class is a [Customized built-in element](https://developers.google.com/web/fundamentals/web-components/customelements#extendhtml). . You must define the native element tag to extend. Only [this elements](https://dom.spec.whatwg.org/#dom-element-attachshadow) are allowed to use Shadow DOM. |

Class decorators allows to define the [custom elements](https://developers.google.com/web/fundamentals/web-components/customelements#define) and are mandatory to build LS elements. By default the tag name will be generated from the class name following the [Kebab case](https://en.wikipedia.org/wiki/Letter_case) but can be defined inside the decorator.
For example MyCounter will be generated as my-counter.

### Property Decorators

| Decorator | Description  |
|--|--|
| `@Attribute()` | Allows to define an attribute. It can be [reflected](https://developers.google.com/web/fundamentals/web-components/customelements#reflectattr) and follows the Kebab case. |
| `@StoredAttribute()` | Allows to use storages (like [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or [SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)) and synchronizes the attribute between windows. |
| `@EventDispatcher()` | Allows to define an [event](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events) to his parent and triggering it easily. It will be defined using Lower case. For example countChanged will be registered as countchanged. |
| `@Store()` | Allows to use stores (like Redux) and update the DOM when a change occurs in the store. |
| `@Child()` | Gets a reference to an element with his id. |

### Method Decorators

| Decorator | Description  |
|--|--|
| `@Observer()` | Runs the decorated function once the attribute changes its value. |

### Hooks

| Hook | Description  |
|--|--|
| `componentWillMount()` | This method is called right before a component mounts. |
| `componentDidMount()` | This method is called after the component has mounted. |
| `componentWillReceiveAttribute()` | This method is called before a component does anything with an attribute. |
| `componentWillUpdate()` | This method is called before re-rendering occurs. |
| `componentDidUpdate()` | This method is called after re-rendering occurs. |
| `componentDidUnmount()` | This method is called after a component is removed from the DOM. |
| `computedReflectedAttributes()` | This method is called in each render. Returns an object with attributes to be reflected to the Custom element. |

## Constructable Stylesheets
If you are not familiar with Constructable Stylesheets please check [this link](https://developers.google.com/web/updates/2019/02/constructable-stylesheets).
To use Constructable Stylesheets simply import AdoptedStyle and use it like an style tag (see [example](https://github.com/lsegurado/ls-element#creating-components)). In case your browser doesn't support this feature, it will return a style tag.
Remember that you need to use Shadow DOM to be able to use Constructable Stylesheets. 

## Performance optimizations
If you want to help the library to make some optimizations you can use the following attributes:
-  _dynamicAttributes: An array with the names of the attributes that can change. 
-  _staticChildren: It indicates that children never change. If you use static Children, there is no need to use _staticChildren or _dynamicAttributes on your children.

## Limitations
### Variable assignment
You need to assign a value using = operator (Similar to React). For example:
For arrays:
```tsx
@Attribute() array = [1,2,3]
// Adding a new element
this.array = [...this.array, 4]
```

For objects:
```tsx
@Attribute() object = { id: 1, text: 'Hello' };
//Changing text
this.object = {...this.object, text: "World"}
```

## Polyfills
If you REALLY need polyfills i recommend you to read this topics:

- https://www.webcomponents.org/polyfills
- https://ungap.github.io

## Browser Support

### Customized built-in elements
- https://www.chromestatus.com/feature/4670146924773376

### Autonomous custom elements
- https://www.chromestatus.com/feature/4696261944934400
- https://www.webcomponents.org/

### Compatibility with frameworks
- https://custom-elements-everywhere.com

## Supporting LS Element
This could be just the beginning of a amazing era. With your support we could make big things, which help us to improve our community and the way that we work. Let's go to revolutionize the IT Industry. You can support us with [this link](https://www.paypal.com/paypalme/lsegurado)

## License
 - [MIT](https://github.com/lsegurado/ls-element/blob/master/LICENSE.md)

[repo-size]: https://img.shields.io/github/repo-size/lsegurado/ls-element
[npm-downloads]: https://img.shields.io/npm/dt/@lsegurado/ls-element
[github-version]: http://img.shields.io/github/package-json/v/lsegurado/ls-element/master?color=%231182c3&label=Current%20version
[github-license]: https://img.shields.io/github/license/lsegurado/ls-element
[github-license-url]: https://github.com/lsegurado/ls-element/blob/master/LICENSE.md
