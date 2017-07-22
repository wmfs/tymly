'use strict'

const _ = require('lodash')
const schema = require('./schema.json')

class Upserting {

  init (stateConfig, options, callback) {
    this.modelId = stateConfig.options.modelId

    const models = options.services.storage.models

    if (models.hasOwnProperty(this.modelId)) {
      this.model = options.services.storage.models[this.modelId]
      callback(null)
    } else {
      callback(
        {
          name: 'unknownModel',
          message: "Unable to initialize Persisting state... unknown model '" + this.modelId + "'"
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
          callback(
            {
              name: 'options',
              message: "Failed to derive runtime options in 'persisting' state",
              body: err
            })
        } else {
          if (options.doc) {
            const docToPersist = _.cloneDeep(options.doc)
            docToPersist._flobotId = flobot.flobotId
            docToPersist.createdBy = flobot.createdBy // TODO: Possibly not the current userId though?

            _this.model.upsert(
              docToPersist,
              {},
              function (err, idProperties) {
                if (err) {
                  console.error(JSON.stringify(err, null, 2))
                  callback(err)
                } else {
                  callback(null)
                }
              }
            )
          } else {
            callback({name: 'noData', message: 'Unable to save document - no document supplied'})
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
  schema: schema,
  autoNudge: true,
  stateClass: Upserting
}
