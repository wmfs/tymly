
class Latch {
  constructor () {
    this.promise_ = new Promise(resolve => {
      this.trigger_ = (result) => resolve(result)
    })
  }

  promise () {
    return this.promise_
  }

  fire (result) {
    this.trigger_(result)
  }
} // class Latch

function makeLatch () {
  return new Latch()
}

class CallbackManager {
  constructor () {
    this.callbacks = {}
  }

  addCallback (eventName, executionName) {
    const latch = makeLatch()
    this.callbacks[executionName] = {
      eventName: eventName,
      timestamp: new Date(),
      latch: latch
    }
    return latch.promise()
  } // addCallback

  fireCallback (eventName, executionName, output) {
    if (!this.hasEvent(eventName, executionName)) {
      return
    }

    const latch = this.callbacks[executionName].latch
    delete this.callbacks[executionName]
    latch.fire(output)
  } // fireCallback

  hasEvent (eventName, executionName) {
    return this.callbacks.hasOwnProperty(executionName) &&
      this.callbacks[executionName].eventName === eventName
  } // hasEvent
} // CallbackManager

module.exports = CallbackManager
