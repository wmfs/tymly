'use strict'

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
    const entries = await this.entryModel.find({where: {diaryId: {equals: this.diaryId}}})

    // todo: use entries and diary (rules) to find out available times

    const availableTimes = [
      new Date('2018-04-17T10:00:00.000Z'),
      new Date('2018-04-17T12:00:00.000Z'),
      new Date('2018-04-17T15:00:00.000Z')
    ]
    context.sendTaskSuccess({availableTimes})
  }
}
