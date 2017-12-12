'use strict'

const _ = require('lodash')

class GetBoard {
  init (resourceConfig, env, callback) {
    this.model = env.bootedServices.storage.models[`tymly_${_.snakeCase(resourceConfig.model)}`]
    this.category = resourceConfig.category
    callback(null)
  }

  run (event, context) {
    const where = {}

    Object.keys(event).map(k => {
      where[k] = {equals: event[k]}
    })

    this.model.findOne({where}, (err, doc) => {
      if (err) context.sendTaskFailure({error: 'getBoardFail', cause: err})
      context.sendTaskSuccess(doc)
    })
  }
}

module.exports = GetBoard
