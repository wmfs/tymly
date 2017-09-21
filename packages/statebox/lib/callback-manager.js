'use strict'

// This is to support the deferred calling of callbacks as set by the 'sendResponse' execution option.
class CallbackManager {
  constructor () {
    this.callbacks = {}
  }

  addCallback (eventName, executionName, callback) {
    if (!this.callbacks.hasOwnProperty(eventName)) {
      this.callbacks[eventName] = {}
    }
    this.callbacks[eventName][executionName] = {
      timestamp: new Date(),
      callback: callback
    }
  }

  getAndRemoveCallback (eventName, executionName) {
    if (this.callbacks.hasOwnProperty(eventName) && this.callbacks[eventName].hasOwnProperty(executionName)) {
      const callback = this.callbacks[eventName][executionName].callback
      delete this.callbacks[eventName][executionName]
      return callback
    }
  }
}

const callbackManager = new CallbackManager()

module.exports = callbackManager
