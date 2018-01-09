'use strict'

class CService {
  boot (options, callback) {
    callback(null)
  }
}

module.exports = {
  serviceClass: CService,
  bootAfter: ['b']
}
