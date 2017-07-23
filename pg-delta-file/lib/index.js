'use strict'

const mkdirp = require('mkdirp')
const getDirName = require('path').dirname
const generateDelta = require('./generate-delta')

module.exports = function setup (options, callback) {
  const outputDirPath = getDirName(options.outputFilepath)

  mkdirp(outputDirPath, function (err) {
    if (err) {
      callback(err)
    } else {
      generateDelta(options, callback)
    }
  })
}
