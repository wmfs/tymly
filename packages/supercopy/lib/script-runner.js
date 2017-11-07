'use strict'

const async = require('async')
const debug = require('debug')('supercopy')

module.exports = function scriptRunner (statements, client, callback) {
  return client.run(statements, callback)
}
