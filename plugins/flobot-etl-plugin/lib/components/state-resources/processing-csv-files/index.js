'use strict'
const smithereens = require('smithereens')
const debug = require('debug')('processingCsvFiles')

class ProcessingCsvFiles {
  init (resourceConfig, env, callback) {
    this.parser = resourceConfig.parser
    this.dirSplits = resourceConfig.dirSplits
    this.fileSplits = resourceConfig.fileSplits
    callback(null)
  }

  run (event, context) {
    debug(`Execution ${context.executionName} is entering state 'processingCsvFiles - enabling debug for 'smithereens' is a good idea too!`)
    smithereens(
      event.sourceFilePaths,
      {
        outputDirRootPath: event.outputDirRootPath,
        parser: this.parser,
        dirSplits: this.dirSplits,
        fileSplits: this.fileSplits
      },
      function (err, manifest) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'smithereenFail',
              cause: err
            }
          )
        } else {
          context.sendTaskSuccess()
        }
      }
    )
  }
}

module.exports = ProcessingCsvFiles
