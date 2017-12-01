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
    let data

    if (this.dataPath) {
      data = jp.value(event, this.dataPath)
    } else {
      data = {}
    }

    if (this.defaults) {
      data = _.defaults(data, this.defaults)
    }

    const requiredHumanInput = {
      uiType: this.uiType,
      uiName: this.uiName,
      data: data
    }

    if (this.uiType === 'board') {
      this.watchedBoards.findOne(
        {
          where: {
            userId: {equals: context.userId},
            feedName: {equals: this.uiName + '|' + data.incidentNumber + '|' + data.incidentYear}
          }
        },
        (err, subscription) => {
          if (err) context.sendTaskFailure({err})
          requiredHumanInput.watchBoardSubscriptionId = subscription.id
          requiredHumanInput.feedName = subscription.feedName
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
