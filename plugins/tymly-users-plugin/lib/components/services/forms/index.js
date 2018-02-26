'use strict'

const path = require('path')
const shasum = require('shasum')
const formMaker = require('form-maker')
const jsonfile = require('jsonfile')
const fs = require('fs')

class FormsService {
  boot (options, callback) {
    this.forms = {}

    const formDefinitions = options.blueprintComponents.forms || {}
    const promises = []

    Object.keys(formDefinitions).map(formId => {
      const formDef = formDefinitions[formId]
      if (formDef.ext === '.yml') {
        const ops = {
          yamlPath: formDef.filePath,
          namespace: formDef.namespace
        }
        ops.formName = path.basename(ops.yamlPath, '.yml')
        ops.modelName = path.basename(ops.yamlPath, '.yml')

        const blueprintPath = ops.yamlPath.split(path.join('forms', ops.formName + '.yml'))[0]
        if (!fs.existsSync(path.resolve(blueprintPath, 'state-machines'))) fs.mkdirSync(path.resolve(blueprintPath, 'state-machines'))
        if (!fs.existsSync(path.resolve(blueprintPath, 'models'))) fs.mkdirSync(path.resolve(blueprintPath, 'models'))
        promises.push(this.writeBlueprintFiles(ops, blueprintPath))

        formId = path.basename(formId, '.yml')
      }

      options.messages.info(formId)
      // Do we need to put the form contents into formDef?
      formDef.shasum = shasum(formDef)
      this.forms[formId] = formDef
    })

    Promise.all(promises)
      .then(() => callback(null))
      .catch(err => callback(err))
  }

  writeBlueprintFiles (options, blueprintPath) {
    return new Promise((resolve, reject) => {
      formMaker(options, (err, result) => {
        if (err) return reject(err)
        jsonfile.writeFile(path.resolve(blueprintPath, 'forms', options.formName + '.json'), result.form, {
          spaces: 2,
          EOL: '\n'
        }, err => {
          if (err) return reject(err)
          jsonfile.writeFile(path.resolve(blueprintPath, 'state-machines', options.formName + '.json'), result.stateMachine, {
            spaces: 2,
            EOL: '\n'
          }, err => {
            if (err) return reject(err)
            // Check if model exists first
            jsonfile.writeFile(path.resolve(blueprintPath, 'models', options.formName + '.json'), result.model, {
              spaces: 2,
              EOL: '\n'
            }, err => {
              if (err) reject(err)
              else resolve()
            })
          })
        })
      })
    })
  }
}

module.exports = {
  serviceClass: FormsService,
  refProperties: {
    formId: 'forms'
  },
  bootBefore: ['tymly', 'rbac', 'storage']
}
