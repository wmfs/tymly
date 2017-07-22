'use strict'

class Walking {
  init (stateConfig, options, callback) {
    callback(null)
  }

  enter (flobot, data, callback) {
    const ctx = flobot.ctx

    let destination
    if (data !== undefined && data.hasOwnProperty('destination')) {
      destination = 'to the ' + data.destination
    } else {
      destination = 'somewhere'
    }

    console.log(' * Oh, looks like ' + ctx.petName + "'s off " + destination + '...')
    callback(null)
  }

  leave (flobot, options, callback) {
    const ctx = flobot.ctx
    console.log(" * That's quite enough walking for now, isn't it " + ctx.petName + '?')
    callback(null)
  }
}

module.exports = {
  autoNudge: false,
  stateClass: Walking
}
