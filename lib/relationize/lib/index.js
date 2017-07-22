/* eslint-env mocha */
'use strict'

const loader = require('./loader')
const parser = require('./parser')

module.exports = function relationize (options, callback) {
  loader(options, function (err, schemaFiles) {
    if (err) {
      callback(err)
    } else {
      callback(null, parser(schemaFiles, options))
    }
  }
  )
}
