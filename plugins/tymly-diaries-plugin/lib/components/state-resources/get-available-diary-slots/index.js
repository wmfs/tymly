'use strict'

const _ = require('lodash')

module.exports = class GetAvailableDiarySlots {
  init (resourceConfig, env, callback) {
    this.diaryId = _.snakeCase(resourceConfig.diaryId)
    callback(null)
  }

  run (event, context) {
    console.log('Diary:', this.diaryId, 'Date given:', event.date)
    // TODO: Look up model to find available times
    const availableTimes = [
      new Date('2018-04-17T10:00:00.000Z'),
      new Date('2018-04-17T12:00:00.000Z'),
      new Date('2018-04-17T15:00:00.000Z')
    ]
    console.log('>', availableTimes)
    context.sendTaskSuccess({availableTimes})
  }
}
