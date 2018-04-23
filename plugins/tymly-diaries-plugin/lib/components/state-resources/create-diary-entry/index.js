'use strict'

const moment = require('moment')

// todo: handle timezones?

module.exports = class CreateDiaryEntry {
  init (resourceConfig, env, callback) {
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    this.diaryId = resourceConfig.diaryId
    this.services = env.bootedServices
    callback(null)
  }

  async run (event, context) {
    const date = moment(event.startDateTime).format('YYYY-MM-DD')
    const namespace = context.stateMachineMeta.namespace
    const diaryService = this.services.diaries
    const diary = diaryService.diaries[namespace + '_' + this.diaryId]
    const endDateTime = moment(event.startDateTime).add(diary.duration, 'minutes')

    // todo: check maxCapacity
    const entriesAtDateTime = await this.entryModel.find({
      where: {
        diaryId: {
          equals: this.diaryId
        },
        startDateTime: {
          equals: event.startDateTime
        }
      }
    })

    if (entriesAtDateTime.length >= diary.maxConcurrency) {
      return context.sendTaskFailure({
        cause: 'createDiaryEntryFail',
        error: 'Max. appointments already made at this time.'
      })
    }

    if (diary.endTime && diary.startTime) {
      const startRule = moment(date + 'T' + diary.startTime)
      const endRule = moment(date + 'T' + diary.endTime)

      const min = moment.min(moment(event.startDateTime), startRule)
      const max = moment.max(endDateTime, endRule)

      if (min !== startRule || max !== endRule) {
        return context.sendTaskFailure({
          cause: 'createDiaryEntryFail',
          error: `The appointment must be between ${startRule.format('HH:mm:ss')} and ${endRule.format('HH:mm:ss')}.`
        })
      }
    }

    if (diary.restrictions) {
      Object.keys(diary.restrictions).forEach(restriction => {
        const timesAffected = diary.restrictions[restriction].timesAffected
        const changes = diary.restrictions[restriction].changes

        if (changes.maxConcurrency && entriesAtDateTime.length >= changes.maxConcurrency) {
          return context.sendTaskFailure({
            cause: 'createDiaryEntryFail',
            error: 'Max. appointments already made at this time.'
          })
        }

        const startRule = moment(date + 'T' + timesAffected[0])
        const endRule = moment(date + 'T' + timesAffected[1])

        if (
          (startRule <= moment(event.startDateTime) && moment(event.startDateTime) >= endRule) ||
          (startRule <= endDateTime && endDateTime >= endRule)
        ) {
          return context.sendTaskFailure({
            cause: 'createDiaryEntryFail',
            error: `The date of this appointment falls within the restriction: ${restriction}.`
          })
        }
      })
    }

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
