'use strict'
const boom = require('boom')

module.exports = class FindingOne {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    this.filterTemplate = resourceConfig.filter || {}
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize FindingOne state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  }

  run (event, context) {
    const filter = context.resolveInputPaths(event, this.filterTemplate)
    this.model.findOne(
      filter,
      function (err, doc) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'FAILED_TO_FIND_ONE',
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
