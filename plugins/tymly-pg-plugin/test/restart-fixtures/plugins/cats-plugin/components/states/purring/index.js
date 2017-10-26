'use strict'

const levelLabels = ['softly', 'away', 'loudly']

class Purring {
  init (stateConfig, options, callback) {
    this.calculateContentmentLevel = options.services.functions.getFunction('tymlyTest', 'calculateContentmentLevel')
    callback(null)
  }

  enter (tymly, data, callback) {
    const ctx = tymly.ctx
    const level = this.calculateContentmentLevel()
    console.log(' * Can you hear that? ' + ctx.petName + ' is purring ' + levelLabels[level] + '! :-)')
    callback(null)
  }

  leave (tymly, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Purring
}
