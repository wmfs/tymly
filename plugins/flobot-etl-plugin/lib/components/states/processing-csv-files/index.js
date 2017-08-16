'use strict'
const smithereens = require('smithereens')
const schema = require('./schema.json')

class ProcessingCsvFiles {
  init (stateConfig, options, callback) {
    this.parser = stateConfig.options.parser
    this.dirSplits = stateConfig.options.dirSplits
    this.fileSplits = stateConfig.options.fileSplits
    callback(null)
  }

  enter (flobot, data, callback) {
    smithereens(
      flobot.ctx.sourceFilePaths,
      {
        outputDirRootPath: flobot.ctx.outputDirRootPath,
        parser: this.parser,
        dirSplits: this.dirSplits,
        fileSplits: this.fileSplits
      },
      function (err, manifest) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    )
  }

  leave (flobot, data, callback) {
    callback(null)
  }
}

module.exports = {
  autoNudge: true,
  stateClass: ProcessingCsvFiles,
  schema: schema
}
