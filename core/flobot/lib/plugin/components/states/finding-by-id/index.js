'use strict'

const _ = require('lodash')
const dottie = require('dottie')
const boom = require('boom')
const schema = require('./schema.json')

class FindingById {
  init (stateConfig, options, callback) {
    this.modelId = stateConfig.options.modelId
    const models = options.services.storage.models

    if (models.hasOwnProperty(this.modelId)) {
      this.model = options.services.storage.models[this.modelId]
      this.pkPropertyIds = this.model.pkPropertyIds
      callback(null)
    } else {
      callback(boom.notFound("Unable to initialize FindingOne state... unknown model '" + this.modelId + "'", {modelId: this.modelId}))
    }
  }

  enter (flobot, data, callback) {
    const _this = this
    this.getOptions(
      flobot,
      function (err, options) {
        if (err) {
          callback(err)
        } else {
          let allKeyValuesSupplied = true
          let keyValues
          if (_.isObject(options.key)) {
            keyValues = []
            _this.pkPropertyIds.forEach(
              function (pkPropertyId) {
                const value = options.key[pkPropertyId]
                if (_.isUndefined(value)) {
                  allKeyValuesSupplied = false
                } else {
                  keyValues.push(value)
                }
              }
            )
          } else {
            if (_.isArray(options.key)) {
              keyValues = options.key
            } else {
              if (_.isUndefined(options.key) || _.isNull(options.key)) {
                allKeyValuesSupplied = false
              } else {
                keyValues = [options.key]
              }
            }
          }

          if (allKeyValuesSupplied) {
            _this.model.findById(
              keyValues,
              function (err, doc) {
                if (err) {
                  callback(err)
                } else {
                  dottie.set(flobot.ctx, options.target, doc)
                  callback(null)
                }
              }
            )
          } else {
            callback(null)
          }
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
  stateClass: FindingById,
  schema: schema
}
