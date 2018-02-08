'use strict'

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

      // Runs only scripts found in /pg-scripts beginning with 'audit-'
      // the rest of the file name is the name of the function
      const promises = Object.keys(this.pgScripts).map(script => {
        const filename = path.parse(this.pgScripts[script].filename).name
        this.auditFunctions.push(filename.substring(filename.indexOf('-') + 1))
        if (filename.split('-')[0] === 'audit') {
          return this.client.runFile(this.pgScripts[script].filePath)
        }
      })

      Promise.all(promises)
        .then(async () => {
          // Create a trigger for each model without 'audit=false' and for each function
          await this.updateTriggers()
          callback(null)
        })
        .catch(err => {
          console.log('ERR:', err)
          callback(err)
        })
    }
  }

  // TODO: Check if the model already has a trigger, if not - create the trigger
  updateTriggers () {
    this.auditFunctions.map(func => {
      Object.keys(this.models).map(async model => {
        const audit = this.models[model].audit !== false
        let triggerSQL
        if (audit) {
          triggerSQL = generateTriggerStatement({
            model: this.models[model],
            function: func,
            action: 'ADD'
          })
        } else {
          triggerSQL = generateTriggerStatement({
            model: this.models[model],
            function: func,
            action: 'REMOVE'
          })
        }
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
  bootAfter: ['storage']
}