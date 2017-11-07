const pg = require('pg')
const statementRunner = require('./pg-statement-runner')

const NotSet = 'NotSet'

class PGClient {
  constructor (connectionString) {
    this.client_ = new pg.Client({
      connectionString: connectionString
    })
    this.client_.connect()

    this.pool_ = new pg.Pool({
      connectionString: connectionString
    })
  }

  query (...args) {
    return this.client_.query(...args)
  } // query

  run (statementsAndParamsArray, callback = NotSet) {
    const result = statementRunner(this.client_, statementsAndParamsArray)

    if (callback === NotSet) {
      return result
    }

    result.
      then(result => callback(null, result)).
      catch(err => callback(err))
  } // run
} // class PGClient

module.exports = PGClient
