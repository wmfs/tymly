'use strict'

module.exports = function calbackFunction () {
  return function calbackFunction (options, callback) {
    callback(null, 'Hello World.')
  }
}
