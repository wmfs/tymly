'use strict'

const boom = require('boom')
const _ = require('lodash')

module.exports = class DeletingById {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      this.pkPropertyIds = this.model.pkPropertyIds
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize DeletingById state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  }

  run (key, context) {
    let allKeyValuesSupplied = true
    let keyValues
    if (_.isObject(key)) {
      keyValues = []
      this.pkPropertyIds.forEach(
        function (pkPropertyId) {
          const value = key[pkPropertyId]
          if (_.isUndefined(value)) {
            allKeyValuesSupplied = false
          } else {
            keyValues.push(value)
          }
        }
      )
    } else {
      if (_.isArray(key)) {
        keyValues = key
      } else {
        if (_.isUndefined(key) || _.isNull(key)) {
          allKeyValuesSupplied = false
        } else {
          keyValues = [key]
        }
      }
    }

    if (allKeyValuesSupplied) {
      this.model.destroyById(
        keyValues,
        function (err, doc) {
          if (err) {
            context.sendTaskFailure(
              {
                error: 'FAILED_TO_DESTORY_BY_ID',
                cause: JSON.stringify(err)
              }
            )
          } else {
            context.sendTaskSuccess(doc)
          }
        }
      )
    } else {
      context.sendTaskSuccess()
    }
  }
}
