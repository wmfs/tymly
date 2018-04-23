'use strict'

const moment = require('moment')

module.exports = class CreateDiaryEntry {
  init (resourceConfig, env, callback) {
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    this.diaryId = resourceConfig.diaryId
    this.services = env.bootedServices
    callback(null)
  }

  run (event, context) {
    const errors = []
    const date = moment(event.startDateTime).format('YYYY-MM-DD')
    const namespace = context.stateMachineMeta.namespace
    const diaryService = this.services.diaries
    const diary = diaryService.diaries[namespace + '_' + this.diaryId]

    const endDateTime = moment(event.startDateTime).add(diary.duration, 'minutes')

    if (diary.endTime && diary.startTime) {
      const endRule = moment(date + 'T' + diary.endTime)
      const startRule = moment(date + 'T' + diary.startTime)

      const max = moment.max(endDateTime, endRule)
      const min = moment.min(moment(event.startDateTime), startRule)

      if (min !== startRule) errors.push(`The appointment must be after ${startRule.format('HH:mm:ss')}.`)
      if (max !== endRule) errors.push(`The appointment must be before ${endRule.format('HH:mm:ss')}.`)
    }

    if (errors.length > 0) {
      return context.sendTaskFailure({error: 'invalid entry time', cause: errors.join(' ')})
    } else {
      this.entryModel.upsert({
        startDateTime: event.startDateTime,
        originId: context.stateMachineMeta.name,
        diaryId: this.diaryId,
        endDateTime: endDateTime.format()
      }, {}, (err, doc) => {
        if (err) return context.sendTaskFailure({error: 'createDiaryEntryFail', cause: err})
        context.sendTaskSuccess(doc)
      })
    }
  }
}
