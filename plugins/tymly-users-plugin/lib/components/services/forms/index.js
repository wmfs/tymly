'use strict'

const path = require('path')
const shasum = require('shasum')
const formMaker = require('form-maker')
const memFs = require('mem-fs')
const editor = require('mem-fs-editor')

class FormsService {
  boot (options, callback) {
    this.forms = {}

    const formDefinitions = options.blueprintComponents.forms || {}

    Object.keys(formDefinitions).map(async formId => {
      const formDef = formDefinitions[formId]
      if (formDef.ext === '.yml') {
        const store = memFs.create()
        const virtualFs = editor.create(store)

        const ops = {
          yamlPath: formDef.filePath,
          namespace: formDef.namespace
        }
        ops.formName = path.basename(ops.yamlPath, '.yml')
        ops.modelName = path.basename(ops.yamlPath, '.yml')

        const result = await this.generateForm(ops)

        const blueprintPath = ops.yamlPath.split(path.join('forms', ops.formName + '.yml'))[0] // Is there an easier way to do this?

        await this.writeJSONToBlueprint(path.resolve(blueprintPath, 'forms', ops.formName + '.json'), result.form, virtualFs)
        await this.writeJSONToBlueprint(path.resolve(blueprintPath, 'state-machines', ops.formName + '.json'), result.stateMachine, virtualFs)
        // Check the model doesn't already exist before producing it maybe?
        await this.writeJSONToBlueprint(path.resolve(blueprintPath, 'models', ops.modelName + '.json'), result.model, virtualFs)
      }

      formDef.shasum = shasum(formDef)
      this.forms[formId] = formDef
    })

    callback(null)
  }

  generateForm (options) {
    return new Promise((resolve, reject) => formMaker(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    }))
  }

  writeJSONToBlueprint (blueprintPath, object, virtualFs) {
    virtualFs.writeJSON(blueprintPath, object, null, 2)
    return new Promise((resolve, reject) => virtualFs.commit((err) => {
      if (err) reject(err)
      else resolve()
    }))
  }
}

module.exports = {
  serviceClass: FormsService,
  refProperties: {
    formId: 'forms'
  },
  bootBefore: ['tymly', 'rbac', 'storage']
}
