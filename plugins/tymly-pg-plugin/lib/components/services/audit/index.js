'use strict'

const schema = require('./schema.json')

class AuditService {
  boot (options, callback) {
    callback(null)
  }
}

module.exports = {
  schema: schema,
  serviceClass: AuditService,
  bootAfter: ['storage']
}
