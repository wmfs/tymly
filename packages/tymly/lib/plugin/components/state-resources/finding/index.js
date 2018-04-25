'use strict'
const boom = require('boom')
const debug = require('debug')('findingOne')
module.exports = class Finding {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    this.filter = resourceConfig.filter
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize Finding state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  }

  run (event, context) {
    debug(`Filtering model '${this.modelId}' ${JSON.stringify(this.filter)} - (executionName='${context.executionName}')`)
    this.model.find(
      this.filter,
      function (err, doc) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'FAILED_TO_FIND',
              cause: JSON.stringify(err)
            }
          )
        } else {
          context.sendTaskSuccess(doc)
        }
      }
    )
  }
}
