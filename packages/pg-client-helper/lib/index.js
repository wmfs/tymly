const pg = require('pg')
const pgStatementRunner = require('./pg-statement-runner')

class PGClient {
  constructor (connectionString) {
    this.client_ = new pg.Client(connectionString)
    this.client_.connect()
  }

  query (...args) {
    return this.client_.query(...args)
  } // query

  run (scriptAndParamArray, callback) {
    return pgStatementRunner(this.client_, scriptAndParamArray, callback)
  } // run
} // class PGClient

module.exports = PGClient
