import { LSCustomElement } from '../types';
import { createSlice, CaseReducer, PayloadAction, createStore } from '@reduxjs/toolkit';
import { setStandardAttribute } from '../utils/setStandardAttribute';
import { standardizePropertyName } from './standardizePropertyName';
import { rerender } from '../render/rerender';

export function addAttributes(self: LSCustomElement) {
  const initialState: any = {};

  self.lsStatic.observedAttributes.forEach(attribute => {
    const attributeName = standardizePropertyName(attribute.propertyName);
    initialState[attribute.propertyName] = self[attributeName] || self[attribute.propertyName];
  });

  const setStateAction: CaseReducer<Date, PayloadAction<any>> = (state, action) => {
    const newState = state;
    Object.keys(action.payload).forEach(key => {
      newState[key] = action.payload[key];
    });
    return newState;
  };

  const AttributesSlice = createSlice({
    name: 'AttributesSlice',
    initialState,
    reducers: {
      setState: setStateAction
    }
  });

  const { reducer, actions } = AttributesSlice;

  const { setState } = actions;

  const store = createStore(reducer);

  self.lsStatic.observedAttributes.forEach(attribute => {
    const attributeName = standardizePropertyName(attribute.propertyName);
    delete self[attribute.propertyName];
    const definedProperty = {
      set(newValue) {
        const oldValue = store.getState()[attribute.propertyName];
        if (newValue != oldValue) {
          const payload = { [attribute.propertyName]: newValue };
          store.dispatch(setState(payload));
          const onChange = attribute?.options?.onChange;
          if (onChange) {
            self[onChange](newValue, oldValue);
          }
          rerender(self);
          if (attribute.options?.reflect) {
            setStandardAttribute(self, attribute.propertyName, newValue);
          }
        }
      },
      get() {
        return store.getState()[attribute.propertyName];
      },
    };
    Object.defineProperty(self, attribute.propertyName, definedProperty);
    if (attribute.propertyName !== attributeName) {
      delete self[attributeName];
      Object.defineProperty(self, attributeName, definedProperty);
    }
    if (attribute.options?.reflect) {
      setStandardAttribute(self, attribute.propertyName, self[attribute.propertyName]);
    }
  });
}