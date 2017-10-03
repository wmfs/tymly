'use strict'
const boom = require('boom')
const _ = require('lodash')

module.exports = class Upserting {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound("Unable to initialize Persisting state... unknown model '" + this.modelId + "'", {modelId: this.modelId}))
    }
  }

  run (doc, context) {
    if (doc) {
      const docToPersist = _.cloneDeep(doc)
      docToPersist._executionName = context.executionName
      // docToPersist.createdBy = tymly.createdBy // TODO: Possibly not the current userId though?

      this.model.upsert(
        docToPersist,
        {},
        function (err, idProperties) {
          if (err) {
            context.sendTaskFailure(
              {
                error: 'FAILED_TO_UPSERT',
                cause: JSON.stringify(err)
              }
            )
          } else {
            context.sendTaskSuccess()
          }
        }
      )
    } else {
      context.sendTaskFailure(
        {
          error: 'NO_DOC_TO_UPSERT',
          cause: 'Unable to save document - no document supplied'
        }
      )
    }
  }
}
