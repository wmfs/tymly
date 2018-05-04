const DateTime = require('luxon').DateTime

class TimestampService {
  static get defaultProvider () {
    return {
      now () {
        return DateTime.local()
      }
    }
  } // defaultProvider

  boot (options, callback) {
    this.timeProvider = TimestampService.defaultProvider
    callback(null)
  }

  now () {
    return this.timeProvider.now()
  }
} // class TimestampService

module.exports = {
  serviceClass: TimestampService,
  bootBefore: ['statebox']
}
