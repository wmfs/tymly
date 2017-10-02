'use strict'

module.exports = function (ctx) {
  return function calculateContentmentLevel () {
    const _ = ctx.utils._
    return _.random(0, 2)
  }
}
