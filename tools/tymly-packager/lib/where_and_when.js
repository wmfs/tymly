const username = require('username').sync
const hostname = require('os').hostname
const moment = require('moment')

function whereAndWhen () {
  const now = moment()

  return {
    user: username(),
    hostname: hostname(),
    timestamp: now.format('YYYY-MM-DD HH:mm:ss')
  }
} // whereAndWhen

module.exports = whereAndWhen
