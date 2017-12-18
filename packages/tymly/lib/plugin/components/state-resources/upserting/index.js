'use strict'
const boom = require('boom')
const _ = require('lodash')

module.exports = class Upserting {
  init (resourceConfig, env, callback) {
    this.setMissingPropertiesToNull = resourceConfig.setMissingPropertiesToNull || false
    this.modelId = resourceConfig.modelId
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize Persisting state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  } // init

  run (doc, context) {
    if (!doc) {
      failed(context, 'NO_DOC_TO_UPSERT', 'Unable to save document - no document supplied')
    }

    const docToPersist = _.cloneDeep(doc)

    docToPersist._executionName = context.executionName
    // docToPersist.createdBy = tymly.createdBy // TODO: Possibly not the current userId though?

    this.model.upsert(docToPersist, {setMissingPropertiesToNull: this.setMissingPropertiesToNull})
      .then(() => context.sendTaskSuccess())
      .catch(err => failed(context, 'FAILED_TO_UPSERT', JSON.stringify(err)))
  } // run
}

function failed (context, error, cause) {
  context.sendTaskFailure({
    error: error,
    cause: cause
  })
}
