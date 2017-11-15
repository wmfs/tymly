'use strict'

const jp = require('jsonpath')
const _ = require('lodash')

/*
* TODO: What should this return in the context?
* TODO: Handle failure if notification not found (look at tymly-mock-api)
* TODO: pg-model and tymly/storage/memory-model need to handle dates
* */

class AwaitingHumanInput {
  init (resourceConfig, env, callback) {
    this.uiType = resourceConfig.uiType
    this.uiName = resourceConfig.uiName
    this.dataPath = resourceConfig.dataPath
    this.defaults = resourceConfig.defaults
    callback(null)
  }

  run (event, context, done) {
    let data

    if (this.dataPath) {
      data = jp.value(event, this.dataPath)
    } else {
      data = {}
    }

    if (this.defaults) {
      data = _.defaults(data, this.defaults)
    }

    context.sendTaskHeartbeat(
      {
        requiredHumanInput: {
          uiType: this.uiType,
          uiName: this.uiName,
          data: data
        }
      },
      function (err, executionDescription) {
        if (err) {
          throw new Error(err)
        } else {
          done(executionDescription)
        }
      }
    )
  }
}

module.exports = AwaitingHumanInput
