'use strict'

const boom = require('boom')
const debug = require('debug')('findingOne')

module.exports = class Finding {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    this.filterTemplate = resourceConfig.filter || {}
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize Finding state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  }

  run (event, context) {
    const filter = context.resolveInputPaths(event, this.filterTemplate)
    debug(`Filtering model '${this.modelId}' ${JSON.stringify(filter)} - (executionName='${context.executionName}')`)
    this.model.find(
      filter,
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
