'use strict'

const boom = require('boom')
const debug = require('debug')('findingOne')
const jp = require('jsonpath')
const _ = require('lodash')

module.exports = class Finding {
  init (resourceConfig, env, callback) {
    this.modelId = resourceConfig.modelId
    this.filterTemplate = resourceConfig.filter
    const models = env.bootedServices.storage.models
    if (models.hasOwnProperty(this.modelId)) {
      this.model = models[this.modelId]
      callback(null)
    } else {
      callback(boom.notFound('Unable to initialize Finding state... unknown model \'' + this.modelId + '\'', {modelId: this.modelId}))
    }
  }

  run (event, context) {
    const filter = processFilter(this.filterTemplate, event)

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

function processFilter (template, event) {
  const filter = {}
  if (template.where) {
    filter.where = {}
    Object.keys(template.where).forEach(property => {
      filter.where[property] = {}
      Object.keys(template.where[property]).forEach(key => {
        const value = template.where[property][key]
        if (_.isString(value)) {
          if (value.substring(0, 2) === '$.') {
            filter.where[property][key] = jp.value(event, value)
          } else {
            filter.where[property][key] = value
          }
        }
      })
    })
  }
  return filter
}
