'use strict'

const _ = require('lodash')
const path = require('path')
const schema = require('./schema.json')
const generateTriggerStatement = require('./generate-trigger-statement')
const debug = require('debug')('tymly-pg-plugin')
const pgInfo = require('pg-info')

class AuditService {
  boot (options, callback) {
    const connectionString = process.env.PG_CONNECTION_STRING || ''
    this.pgScripts = options.blueprintComponents.pgScripts || {}
    this.models = options.blueprintComponents.models || {}
    this.client = options.bootedServices.storage.client
    this.schemaNames = options.bootedServices.storage.schemaNames

    if (connectionString) {
      this.auditFunctions = []

      const promises = Object.keys(this.pgScripts).map(script => {
        debug(`Found script: ${script}`)
        const filename = path.parse(this.pgScripts[script].filename).name
        if (filename.split('-')[0] === 'audit') {
          debug(`Found audit function: ${filename.substring(filename.indexOf('-') + 1)}`)
          this.auditFunctions.push(filename.substring(filename.indexOf('-') + 1))
          return this.client.runFile(this.pgScripts[script].filePath)
        }
      })

      Promise.all(promises)
        .then(async () => {
          await this.updateTriggers()
          callback(null)
        })
        .catch(err => callback(err))
    }
  }

  updateTriggers () {
    this.auditFunctions.map(func => {
      Object.keys(this.models).map(async model => {
        const audit = this.models[model].audit !== false

        const namespace = _.snakeCase(this.models[model].namespace)
        const name = _.snakeCase(this.models[model].name)
        const triggerName = `${namespace}_${name}_auditor`

        const currentDbStructure = await pgInfo({
          client: this.client,
          schemas: this.schemaNames
        })

        const currentTriggers = currentDbStructure.schemas[namespace].tables[name].triggers
        const trigger = Object.keys(currentTriggers).includes(triggerName)
        const action = (!trigger && audit) ? 'ADD' : ((trigger && !audit) ? 'REMOVE' : 'NONE')
        debug(`Model: ${model}, Wants to audit: ${audit}, Already has trigger: ${trigger}, Action: ${action}`)

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
