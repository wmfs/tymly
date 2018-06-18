const moment = require('moment')
const schema = require('./schema.json')

class TimestampService {
  static get defaultProvider () {
    return {
      now () {
        return moment()
      },
      today () {
        return moment().hour(0).minute(0).second(0).millisecond(0)
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

  today () {
    return this.timeProvider.today()
  }
} // class TimestampService

module.exports = {
  serviceClass: TimestampService,
  schema: schema,
  bootBefore: ['statebox']
}
