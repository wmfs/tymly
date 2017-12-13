'use strict'

const jp = require('jsonpath')
const _ = require('lodash')

class AwaitingHumanInput {
  init (resourceConfig, env, callback) {
    this.uiType = resourceConfig.uiType
    this.uiName = resourceConfig.uiName
    this.dataPath = resourceConfig.dataPath
    this.defaults = resourceConfig.defaults
    this.watchedBoards = env.bootedServices.storage.models['tymly_watchedBoards']
    callback(null)
  }

  run (event, context, done) {
    let data = {}
    if (this.dataPath) data = jp.value(event, this.dataPath)
    if (this.defaults) data = _.defaults(data, this.defaults)

    const requiredHumanInput = {
      uiType: this.uiType,
      uiName: this.uiName,
      data: data
    }

    if (this.uiType === 'board') {
      if (event.data) requiredHumanInput.data = event.data
      if (event.boardKeys) requiredHumanInput.boardKeys = event.boardKeys

      const feedName = [this.uiName]
      Object.keys(data).sort().map(k => feedName.push(data[k]))

      this.watchedBoards.findOne(
        {
          where: {
            userId: {equals: context.userId},
            feedName: {equals: feedName.join('|')}
          }
        },
        (err, subscription) => {
          if (err) context.sendTaskFailure({err})
          if (subscription) {
            requiredHumanInput.watchBoardSubscriptionId = subscription.id
            requiredHumanInput.feedName = subscription.feedName
          }
          context.sendTaskHeartbeat({requiredHumanInput}, (err, executionDescription) => {
            if (err) throw new Error(err)
            done(executionDescription)
          })
        }
      )
    } else {
      context.sendTaskHeartbeat({requiredHumanInput}, (err, executionDescription) => {
        if (err) throw new Error(err)
        done(executionDescription)
      })
    }
  }
}

module.exports = AwaitingHumanInput
