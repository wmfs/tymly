'use strict'

const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const debug = require('debug')('statebox')

module.exports = function (options, callback) {
  fs.readFile(
    path.resolve(__dirname, './templates/install-database.sql.ejs'),
    {},
    function (err, buffer) {
      if (err) {
        callback(err)
      } else {
        const installTemplate = buffer.toString()
        const sql = ejs.render(installTemplate, options)
        options.client.query(
          sql,
          [],
          function (err) {
            if (err) {
              // TODO: Rollback (and test the rollback worked too) but don't close connection.
              callback(err)
            } else {
              debug(`Installed database objects in schema ' ${options.schemaName}'`)
              callback(null)
            }
          }
        )
      }
    }
  )
}
