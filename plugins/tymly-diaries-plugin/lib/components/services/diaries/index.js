'use strict'

class DiaryService {
  boot (options, callback) {
    this.diaries = options.blueprintComponents.diaries || {}
    callback(null)
  }
}

module.exports = {
  serviceClass: DiaryService
}
