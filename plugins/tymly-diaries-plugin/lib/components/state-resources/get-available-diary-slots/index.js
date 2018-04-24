'use strict'

const getAvailableDiarySlots = require('./helpers/generate-time-slots')
const moment = require('moment')

module.exports = class GetAvailableDiarySlots {
  init (resourceConfig, env, callback) {
    this.entryModel = env.bootedServices.storage.models['tymly_diaryEntry']
    this.diaryId = resourceConfig.diaryId
    this.services = env.bootedServices
    callback(null)
  }

  async run (event, context) {
    const namespace = context.stateMachineMeta.namespace
    const diaryService = this.services.diaries
    const diary = diaryService.diaries[namespace + '_' + this.diaryId]
    const entries = await this.entryModel.find({where: {'diaryId': {equals: this.diaryId}}})

    const availableTimes = getAvailableDiarySlots(diary, event.date)

    Object.values(availableTimes).forEach((timeSlot, index) => {
      Object.values(entries).forEach(booking => {
        if (timeSlot[0] === moment(booking.startDateTime).format('HH:mm:ss')) {
          timeSlot[1]++
          if (timeSlot[1] >= diary.maxConcurrency) availableTimes.splice(index, 1)
        }
      })
    })

    const times = Object.values(availableTimes).map((timeSlot) => {
      const t = moment(event.date.split('T')[0] + 'T' + timeSlot[0])
      return {
        label: t.format('HH:mm:ss'),
        value: t.format()
      }
    })

    context.sendTaskSuccess({availableTimes: times})
  }
}
