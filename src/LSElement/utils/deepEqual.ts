export function deepEqual(object1, object2) {
  if (object1 || object2) {
    const type = typeof object1;
    const areDifferentTypes = type !== typeof object2;
    if (areDifferentTypes) {
      return false;
    }
    switch (type) {
      case 'function': {
        return object1.name === object2.name && object1.toString() === object2.toString();
      }
      case 'object': {
        // TODO: add set / map etc
        if (Array.isArray(object1)) {
          if (object1.length !== object2.length)
            return false;

          return !object1.find((value, index) => !deepEqual(value, object2[index]));
        } 
        const keys1 = Object.keys(object1);
        const keys2 = Object.keys(object2);

        if (keys1.length !== keys2.length)
          return false;

        return !keys1.find(key => !deepEqual(object1[key], object2[key]));
        
      }
      default: return object1 === object2;
    }
  } else {//Null / Undefined
    return object1 == object2;
  }
}
