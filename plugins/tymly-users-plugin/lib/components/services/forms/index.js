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
        const meta = {
          yamlPath: formDef.filePath,
          namespace: formDef.namespace
        }
        meta.formName = path.basename(meta.yamlPath, '.yml')
        meta.modelName = path.basename(meta.yamlPath, '.yml')

        const blueprintPath = meta.yamlPath.split(path.join('forms', meta.formName + '.yml'))[0]
        if (!fs.existsSync(path.resolve(blueprintPath, 'state-machines'))) fs.mkdirSync(path.resolve(blueprintPath, 'state-machines'))
        if (!fs.existsSync(path.resolve(blueprintPath, 'models'))) fs.mkdirSync(path.resolve(blueprintPath, 'models'))

        promises.push(this.writeBlueprintFiles(options, meta, blueprintPath))

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

  // TODO: Create the categories if needed - categories can be found at result.categories (it's an array)
  writeBlueprintFiles (options, meta, blueprintPath) {
    return new Promise((resolve, reject) => {
      formMaker(meta, (err, result) => {
        if (err) return reject(err)
        jsonfile.writeFile(path.resolve(blueprintPath, 'forms', meta.formName + '.json'), result.form, {
          spaces: 2,
          EOL: '\n'
        }, err => {
          if (err) return reject(err)
          jsonfile.writeFile(path.resolve(blueprintPath, 'state-machines', meta.formName + '.json'), result.stateMachine, {
            spaces: 2,
            EOL: '\n'
          }, err => {
            if (err) return reject(err)
            if (!options.blueprintComponents.models[`${meta.namespace}_${meta.modelName}`]) {
              jsonfile.writeFile(path.resolve(blueprintPath, 'models', meta.modelName + '.json'), result.model, {
                spaces: 2,
                EOL: '\n'
              }, err => {
                if (err) return reject(err)
                options.blueprintComponents.models[`${meta.namespace}_${meta.modelName}`] = getModelDefinition(result.model, meta)
                options.blueprintComponents.stateMachines[`${meta.namespace}_${meta.formName}_1_0`] = getStateMachineDefinition(result.stateMachine, meta)
                resolve()
              })
            } else {
              resolve()
            }
          })
        })
      })
    })
  }
}

function getModelDefinition (model, meta) {
  return {
    title: model.title,
    description: model.description,
    type: 'object',
    properties: model.properties,
    namespace: meta.namespace,
    id: meta.modelName,
    name: meta.modelName
  }
}

function getStateMachineDefinition (stateMachine, meta) {
  stateMachine.namespace = meta.namespace
  stateMachine.id = meta.formName
  return stateMachine
}

module.exports = {
  serviceClass: FormsService,
  refProperties: {
    formId: 'forms'
  },
  bootBefore: ['tymly', 'rbac', 'storage']
}
