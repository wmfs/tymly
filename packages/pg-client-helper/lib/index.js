const pg = require('pg')
const statementRunner = require('./pg-statement-runner')

const NotSet = 'NotSet'

class PGClient {
  constructor (connectionString) {
    this.client_ = new pg.Client({
      connectionString: connectionString
    })
    this.client_.connect()
  }

  query (...args) {
    return this.client_.query(...args)
  } // query

  run (statementsAndParamsArray, callback = NotSet) {
    if (callback === NotSet) {
      return statementRunner(this.client_, statementsAndParamsArray)
    }
    statementRunner(this.client_, statementsAndParamsArray).
    then(result => callback(null, result)).
    catch(err => callback(err))
  } // run
} // class PGClient

module.exports = PGClient
