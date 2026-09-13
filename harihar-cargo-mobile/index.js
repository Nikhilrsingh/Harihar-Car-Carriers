if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'Error';
      this.code = 0;
    }
  };
  global.DOMException = globalThis.DOMException;
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);