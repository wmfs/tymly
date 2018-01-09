'use strict'

class AService {
  boot (options, callback) {
    callback(null)
  }
}

module.exports = {
  serviceClass: AService,
  bootBefore: ['b']
}
