const boom = require('boom')

function boomUp (err, msg) {
  if (err.isBoom) {
    return err
  }

  return boom.internal(msg, err)
} // boomUp

module.exports = boomUp
