'use strict'

const moment = require('moment')

// todo: handle timezones?

module.exports = class CreateDiaryEntry {
  init (resourceConfig, env, callback) {
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    this.resourceConfig = resourceConfig
    this.diaryId = resourceConfig.diaryId
    this.services = env.bootedServices
    callback(null)
  }

  async run (event, context) {
    event.startDateTime = moment(event.startDateTime).format('YYYY-MM-DD HH:mm:ss')

    const date = moment(event.startDateTime).format('YYYY-MM-DD')
    const namespace = context.stateMachineMeta.namespace
    const diaryService = this.services.diaries
    const diary = diaryService.diaries[namespace + '_' + this.diaryId]
    const endDateTime = moment(event.startDateTime).add(diary.slots.durationMinutes, 'minutes')

    const entriesAtDate = await this.entryModel.find({
      where: {
        diaryId: {
          equals: this.diaryId
        },
        startDateTime: {
          like: date
        }
      }
    })

    const entriesAtDateTime = entriesAtDate.filter(entry => event.startDateTime === entry.startDateTime)

    if (entriesAtDate.length >= diary.slots.maxCapacity) {
      return context.sendTaskFailure({
        cause: 'createDiaryEntryFail',
        error: 'Max. appointments already made at this date.'
      })
    }

    if (entriesAtDateTime.length >= diary.slots.maxConcurrency) {
      return context.sendTaskFailure({
        cause: 'createDiaryEntryFail',
        error: 'Max. appointments already made at this time.'
      })
    }

    if (diary.slots.endTime && diary.slots.startTime) {
      const startRule = moment(date + 'T' + diary.slots.startTime)
      const endRule = moment(date + 'T' + diary.slots.endTime)

      const min = moment.min(moment(event.startDateTime), startRule)
      const max = moment.max(endDateTime, endRule)

      if (min !== startRule || max !== endRule) {
        return context.sendTaskFailure({
          cause: 'createDiaryEntryFail',
          error: `The appointment must be between ${startRule.format('HH:mm')} and ${endRule.format('HH:mm')}.`
        })
      }
    }

    if (diary.slots.restrictions) {
      let error = false
      Object.keys(diary.slots.restrictions).forEach(restriction => {
        const timesAffected = diary.slots.restrictions[restriction].timesAffected
        const changes = diary.slots.restrictions[restriction].changes

        const startRule = moment(date + 'T' + timesAffected[0])
        const endRule = moment(date + 'T' + timesAffected[1])

        if (
          (isWithinDateTimeRange(startRule, endRule, event.startDateTime) ||
            isWithinDateTimeRange(startRule, endRule, endDateTime)) &&
          entriesAtDateTime.length >= changes.maxConcurrency
        ) {
          error = true
        }
      })
      if (error) {
        return context.sendTaskFailure({
          cause: 'createDiaryEntryFail',
          error: 'Max. appointments already made at this time.'
        })
      }
    }

    const options = {
      startDateTime: event.startDateTime,
      originId: this.resourceConfig.originId || context.stateMachineMeta.name,
      diaryId: this.diaryId,
      endDateTime: endDateTime.format()
    }

    if (event.information) options.info = event.information

    this.entryModel.upsert(options, {}, (err, doc) => {
      if (err) return context.sendTaskFailure({error: 'createDiaryEntryFail', cause: err})
      context.sendTaskSuccess(doc)
    })
  }
}

function isWithinDateTimeRange (start, end, dateTime) {
  return (start <= moment(dateTime) && moment(dateTime) >= end)
}
