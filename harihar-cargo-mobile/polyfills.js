// polyfills.js
if (typeof globalThis.DOMException === 'undefined') {
  const DOMExceptionPolyfill = function (message, name) {
    const error = new Error(message);
    error.name = name || 'Error';
    error.code = 0;
    return error;
  };
  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  DOMExceptionPolyfill.prototype.constructor = DOMExceptionPolyfill;

  globalThis.DOMException = DOMExceptionPolyfill;
  global.DOMException = DOMExceptionPolyfill;
}