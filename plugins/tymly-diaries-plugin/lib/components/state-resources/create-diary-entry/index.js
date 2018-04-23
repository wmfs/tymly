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

    // todo: check against maxConcurrency & maxCapacity

    if (diary.endTime && diary.startTime) {
      const startRule = moment(date + 'T' + diary.startTime)
      const endRule = moment(date + 'T' + diary.endTime)

      const min = moment.min(moment(event.startDateTime), startRule)
      const max = moment.max(endDateTime, endRule)

      if (min !== startRule) errors.push(`The appointment must be after ${startRule.format('HH:mm:ss')}.`)
      if (max !== endRule) errors.push(`The appointment must be before ${endRule.format('HH:mm:ss')}.`)
    }

    if (diary.restrictions) {
      Object.keys(diary.restrictions).forEach(restriction => {
        const timesAffected = diary.restrictions[restriction].timesAffected
        // const changes = diary.restrictions[restriction].changes

        const startRule = moment(date + 'T' + timesAffected[0])
        const endRule = moment(date + 'T' + timesAffected[1])

        if (
          (startRule <= moment(event.startDateTime) && moment(event.startDateTime) >= endRule) ||
          (startRule <= endDateTime && endDateTime >= endRule)
        ) {
          // todo: check the changed concurrency
          errors.push(`The start date of this appointment falls within the restriction: ${restriction}.`)
        }
      })
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
