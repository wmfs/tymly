'use strict'

const dottie = require('dottie')

const schema = require('./schema.json')

class FindingOne {

  init (stateConfig, options, callback) {
    this.modelId = stateConfig.options.modelId
    this.select = stateConfig.options.select || '-_id -__v -createdAt -updatedAt'

    const models = options.services.storage.models

    if (models.hasOwnProperty(this.modelId)) {
      this.model = options.services.storage.models[this.modelId]
      callback(null)
    } else {
      callback(
        {
          name: 'unknownModel',
          message: "Unable to initialize FindingOne state... unknown model '" + this.modelId + "'"
        }
      )
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
          _this.model.findOne(
            options.filter || {},
            function (err, doc) {
              if (err) {
                callback(err)
              } else {
                dottie.set(flobot.ctx, options.target, doc)
                callback(null)
              }
            }
          )
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
  stateClass: FindingOne,
  schema: schema
}
