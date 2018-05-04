const makeDir = require('make-dir')
const getDirName = require('path').dirname
const generateDelta = require('./generate-delta')

module.exports = function setup (options, callback) {
  const outputDirPath = getDirName(options.outputFilepath)

  const theExport = makeDir(outputDirPath)
    .then(() => generateDelta(options))

  if (!callback) return theExport

  theExport
    .then(info => callback(null, info))
    .catch(err => callback(err))
}
