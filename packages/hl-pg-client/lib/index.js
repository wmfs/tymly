const pg = require('pg')
const fs = require('fs')
const statementRunner = require('./pg-statement-runner')

const NotSet = 'NotSet'

class PGClient {
  constructor (connectionString) {
    this.pool_ = new pg.Pool({
      connectionString: connectionString
    })
  }

  query (...args) {
    return this.pool_.query(...args)
  } // query

  run (statementsAndParamsArray, callback = NotSet) {
    const result = statementRunner(this.pool_, statementsAndParamsArray)

    if (callback === NotSet) {
      return result
    }

    result
      .then(result => callback(null, result))
      .catch(err => callback(err))
  } // run

  runFile (fileName, callback = NotSet) {
    const sql = fs.readFileSync(fileName, 'utf8')
    const statements = sql.split(';')
      .map(s => s.replace(/\n/g, ''))
      .filter(s => s.length !== 0)
      .map(s => `${s};`)
      .map(s => { return { sql: s } })
    return this.run(statements, callback)
  } // runFromFile
} // class PGClient

module.exports = PGClient
