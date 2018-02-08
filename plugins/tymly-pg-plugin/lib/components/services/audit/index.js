'use strict'

const _ = require('lodash')
const path = require('path')
const schema = require('./schema.json')
const HlPgClient = require('hl-pg-client')
const generateTriggerStatement = require('./generate-trigger-statement')

class AuditService {
  boot (options, callback) {
    const connectionString = process.env.PG_CONNECTION_STRING || ''
    this.pgScripts = options.blueprintComponents.pgScripts || {}
    this.models = options.blueprintComponents.models || {}

    if (connectionString) {
      this.client = new HlPgClient(connectionString)
      this.auditFunctions = []

      const promises = Object.keys(this.pgScripts).map(script => {
        const filename = path.parse(this.pgScripts[script].filename).name
        this.auditFunctions.push(filename.substring(filename.indexOf('-') + 1))
        if (filename.split('-')[0] === 'audit') {
          return this.client.runFile(this.pgScripts[script].filePath)
        }
      })

      Promise.all(promises)
        .then(async () => {
          await this.updateTriggers()
          callback(null)
        })
        .catch(err => {
          console.log('ERR:', err)
          callback(err)
        })
    }
  }

  updateTriggers () {
    this.auditFunctions.map(func => {
      Object.keys(this.models).map(async model => {
        const audit = this.models[model].audit !== false

        // Check if trigger already exists - if so then don't query
        // TODO: Ideally this should be read from pg-info rather than hardcoded but this does the job for now
        const namespace = _.snakeCase(this.models[model].namespace)
        const name = _.snakeCase(this.models[model].name)
        const res = await this.client.query(`SELECT * FROM information_schema.triggers WHERE trigger_name = '${namespace}_${name}_auditor';`)
        const action = (res.rowCount === 0 && audit) ? 'ADD' : ((res.rowCount === 1 && !audit) ? 'REMOVE' : '')
        const triggerSQL = generateTriggerStatement({
          model: this.models[model],
          function: func,
          action: action
        })

        await this.client.query(triggerSQL)
      })
    })
  }

  async shutdown () {
    await this.client.end()
  }
}

module.exports = {
  schema: schema,
  serviceClass: AuditService,
  bootAfter: ['storage', 'statebox']
}
