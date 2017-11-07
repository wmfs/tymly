// note that statementsAndParams should be an array of objects, where each
// object has a sql (string) property and a params (array) property
function pgScriptRunner (client, statementsAndParams, callback) {
  ensureBeginAndEnd(statementsAndParams)

  const doStatement = async (index, ctx) => {
    if (index == statementsAndParams.length) {
      return ctx.returnValue
    }

    const data = statementsAndParams[index]

    try {
      if (data.preStatementHook) {
        data.preStatementHook(data, ctx)
      }

      const result = await client.query(data.sql, data.params)

      if (data.postStatementHook) {
        data.postStatementHook(result, ctx)
      }
    } catch(err) {
      throw [err, data.sql]
    }

    return doStatement(index+1, ctx)
  } // doStatement

  return doStatement(0, { }).
    catch(([err, statement]) => {
      rollback(err, statement, client)
      throw err
    })
} // pgScriptRunner

function rollback(err, statement, client) {
  console.error('')
  console.error('ScriptRunner fail!')
  console.error('------------------')
  console.error()
  console.error(JSON.stringify(statement, null, 2))
  console.error(err)
  console.error('')
  return client.query('ROLLBACK;').
    then(() => console.log('ROLLBACK SUCCESSFUL.')).
    catch(rollbackErr => console.error(`FAILED TO ROLLBACK AS WELL! ${rollbackErr}`))
}

////////////////
const BEGIN = 'BEGIN'
const END = 'END;'
function statement(stmt) {
  return {
    'sql': stmt,
    'params': []
  }
} // statement
const beginStatement = statement(BEGIN)
const endStatement = statement(END)

function ensureBeginAndEnd (statementsAndParams) {
  if (statementsAndParams.length !== 0 && statementsAndParams[0].sql !== BEGIN) {
    statementsAndParams.unshift(beginStatement)
  }

  if (statementsAndParams.length !== 0 && statementsAndParams[statementsAndParams.length - 1].sql !== END) {
    statementsAndParams.push(endStatement)
  }
} // ensureBeginAndEnd

const NotSet = 'NotSet'

module.exports = function (client, statementsAndParams, callback = NotSet) {
  if (callback === NotSet) {
    return pgScriptRunner(client, statementsAndParams)
  }
  pgScriptRunner(client, statementsAndParams).
    then(result => callback(null, result)).
    catch(err => callback(err))
} //
