'use strict'
const boom = require('boom')
const _ = require('lodash')

module.exports = class Upserting {
  init (resourceConfig, env, callback) {
    this.setMissingPropertiesToNull = resourceConfig.setMissingPropertiesToNull || false
    this.modelId = resourceConfig.modelId
    const models = env.bootedServices.storage.models
    if (env.bootedServices.userInfo) this.userInfo = env.bootedServices.userInfo
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize Persisting state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  } // init

  async run (doc, context) {
    if (!doc) {
      failed(context, 'NO_DOC_TO_UPSERT', 'Unable to save document - no document supplied')
    }

    const docToPersist = _.cloneDeep(doc)

    docToPersist._executionName = context.executionName
    // docToPersist.createdBy = tymly.createdBy // TODO: Possibly not the current userId though?

    if (this.userInfo) {
      const userEmail = await this.userInfo.getEmailFromUserId(context.userId)
      // set modified by to userEmail - only set created by if it's a new record
      console.log('email:', userEmail)
    }

    this.model.upsert(docToPersist, {setMissingPropertiesToNull: this.setMissingPropertiesToNull})
      .then(docId => context.sendTaskSuccess(docId))
      .catch(err => failed(context, 'FAILED_TO_UPSERT', JSON.stringify(err)))
  } // run
}

function failed (context, error, cause) {
  context.sendTaskFailure({
    error: error,
    cause: cause
  })
}
