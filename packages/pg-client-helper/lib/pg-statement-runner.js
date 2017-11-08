// note that statementsAndParams should be an array of objects, where each
// object has a sql (string) property and a params (array) property

function query (sql, params, client) {
  return client.query(sql, params)
}

async function pgScriptRunner (pool, statementsAndParams) {
  const client = await pool.connect()
  try {
    ensureBeginAndEnd(statementsAndParams)

    const ctx = { }
    for (const data of statementsAndParams) {
      try {
        if (data.preStatementHook) {
          data.preStatementHook(data, ctx)
        }

        const action = data.action || query
        const result = await action(data.sql, data.params, client)

        if (data.postStatementHook) {
          data.postStatementHook(result, ctx)
        }
      } catch (err) {
        await rollback(err, data.sql, client)
        throw err
      } // catch ...
    } // for ...

    return ctx.returnValue
  } finally {
    client.release()
  }
} // pgScriptRunner

function rollback (err, statement, client) {
  console.error('')
  console.error('ScriptRunner fail!')
  console.error('------------------')
  console.error()
  console.error(JSON.stringify(statement, null, 2))
  console.error(err)
  console.error('')
  return client.query('ROLLBACK;')
    .then(() => console.log('ROLLBACK SUCCESSFUL.'))
    .catch(rollbackErr => console.error(`FAILED TO ROLLBACK AS WELL! ${rollbackErr}`))
}

/// /////////////
const BEGIN = 'BEGIN;'
const COMMIT = 'COMMIT;'
const END = 'END;'
const VACUUM = 'VACUUM'

function statement (stmt) {
  return {
    'sql': stmt,
    'params': []
  }
} // statement
const beginStatement = statement(BEGIN)
const endStatement = statement(END)

function ensureBeginAndEnd (statementsAndParams) {
  // this should really attempt to match BEGIN and ENDS more intelligently
  if (statementsAndParams.length === 0) {
    return
  }

  const firstStatement = statementsAndParams[0].sql
  const lastStatement = statementsAndParams[statementsAndParams.length - 1].sql

  if (firstStatement !== BEGIN && !firstStatement.startsWith(VACUUM)) {
    statementsAndParams.unshift(beginStatement)
  }

  if (lastStatement.startsWith(VACUUM)) {
    return
  }

  if (lastStatement !== END && lastStatement !== COMMIT) {
    statementsAndParams.push(endStatement)
  }
} // ensureBeginAndEnd

module.exports = pgScriptRunner
