'use strict'

const _ = require('lodash')

module.exports = function logBoomError (boomErr, flobot) {
  let message = '--------------------------------------------------------------------------------------\n'
  message += `|${boomErr.output.statusCode}: ${boomErr.output.payload.error}\n`
  message += `|${boomErr.message}\n`
  if (_.isObject(boomErr.data)) {
    message += `|${JSON.stringify(boomErr.data, null, 2)}\n`
  }
  message += '--------------------------------------------------------------------------------------\n\n'
  console.error(message)
}
