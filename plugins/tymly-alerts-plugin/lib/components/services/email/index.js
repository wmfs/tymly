'use strict'
const schema = require('./schema.json')

const nodemailer = require('nodemailer')

class EmailService {
  boot (options, callback) {
    const emailOptions = options.config.email
    this.from = emailOptions.from
    this.transport = nodemailer.createTransport(emailOptions.transport)

    callback(null)
  }
}

module.exports = {
  serviceClass: EmailService,
  bootBefore: ['tymlys'],
  schema: schema
}
