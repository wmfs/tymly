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
    const namespace = context.stateMachineMeta.namespace
    const diaryService = this.services.diaries
    const diary = diaryService.diaries[namespace + '_' + this.diaryId]

    // todo: check if end datetime doesn't fall after diary.endTime rule or diary.restrictions
    const endDateTime = moment(event.startDateTime)
      .add(diary.duration, 'minutes')
      .format()

    this.entryModel.upsert({
      startDateTime: event.startDateTime,
      originId: context.stateMachineMeta.name,
      diaryId: this.diaryId,
      endDateTime: endDateTime
    }, {}, (err, doc) => {
      if (err) return context.sendTaskFailure({error: 'createDiaryEntryFail', cause: err})
      context.sendTaskSuccess(doc)
    })
  }
}
