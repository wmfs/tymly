const makeDir = require('make-dir')
const getDirName = require('path').dirname
const generateDelta = require('./generate-delta')

module.exports = function setup (options, callback) {
  const outputDirPath = getDirName(options.outputFilepath)

  makeDir(outputDirPath)
    .then(() => generateDelta(options))
    .then(info => callback(null, info))
    .catch(err => callback(err))
}
