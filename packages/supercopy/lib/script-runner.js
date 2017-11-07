'use strict'

const async = require('async')
const debug = require('debug')('supercopy')
const fs = require('fs')
const copyFrom = require('pg-copy-streams').from
const _ = require('lodash')

function copyStream(statement, client) {
  return new Promise((resolve, reject) => {
    const components = statement.match(/COPY (.*?) FROM '([^']*)'/)
    const tableAndCols = components[1]
    const filename = components[2]
    const newStatement = `COPY ${tableAndCols} FROM STDIN CSV HEADER;`
    debug(`Stream-Copy: ${newStatement} -- (${filename})`)
    const stream = client.query(
      copyFrom(newStatement)
    )
    stream.on('end', function () {
      resolve()
    }).on('error', function (err) {
      reject(err)
    })

    const fileStream = fs.createReadStream(filename)
    fileStream.on('error', function (err) {
      reject(err)
    })

    fileStream.pipe(stream)
  })
} // copyStream

module.exports = function scriptRunner (statements, client, callback) {
  let i = -1
  async.eachSeries(
    statements,
    function (statementAndParam, cb) {
      const statement = statementAndParam.sql
      i++
      if (statement.startsWith('COPY ')) {
        copyStream(statement, client).
          then(() => cb()).
          catch(err => cb(err))
      } else {
        debug(`Running: ${statement}`)
        client.query(
          statement,
          [],
          cb
        )
      }
    },
    function (err) {
      if (err) {
        console.error('')
        console.error('scriptRunner fail!')
        console.error('------------------')
        console.error()
        console.error(JSON.stringify(statements[i], null, 2))
        console.error(err)
        console.error('')
        client.query(
          'ROLLBACK;',
          function (rollbackErr) {
            if (rollbackErr) {
              console.error('FAILED TO ROLLBACK AS WELL! ' + rollbackErr)
            } else {
              console.log('ROLLBACK SUCCESSFUL.')
            }
            callback(err)
          }
        )
      } else {
        callback(null)
      }
    }
  )
}
