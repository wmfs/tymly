const DateTime = require('luxon').DateTime
const schema = require('./schema.json')

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
  schema: schema,
  bootBefore: ['statebox']
}
