'use strict'

const _ = require('lodash')

class GetBoardData {
  init (resourceConfig, env, callback) {
    this.schema = require('./schema.json')
    this.models = env.bootedServices.storage.models
    this.modelName = resourceConfig.model
    callback(null)
  }

  run (event, context) {
    const where = {}

    Object.keys(event.boardKeys).map(k => {
      where[k] = {equals: event.boardKeys[k]}
    })

    if (_.isArray(this.modelName)) {
      const models = this.modelName.map(m => this.models[`${context.stateMachineMeta.namespace}_${m}`])
      const findPromises = models.map(model => model.findOne({where}))
      Promise.all(findPromises)
        .then(docs => {
          const data = {}
          models.map((model, idx) => data[model.modelId] = docs[idx])
          Object.keys(event).map(key => {
            if (key !== 'boardKeys') data[key] = event[key]
          })
          context.sendTaskSuccess({data: data, boardKeys: event.boardKeys})
        })
        .catch(err => context.sendTaskFailure({error: 'getBoardFail', cause: err}))
    } else {
      const model = this.models[`${context.stateMachineMeta.namespace}_${this.modelName}`]
      model.findOne({where})
        .then(doc => context.sendTaskSuccess({data: doc, boardKeys: event.boardKeys}))
        .catch(err => context.sendTaskFailure({error: 'getBoardFail', cause: err}))
    }
  }
}

module.exports = GetBoardData
