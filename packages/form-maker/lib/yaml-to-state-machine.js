'use strict'

const yamlToJs = require('./utils/yaml-to-js')

// Do we want options to include the following states:
// SetDefaults -> will need to do dataPath thing
// DeltaReindex

class YamlToStateMachine {
  generateStateMachine (options, callback) {
    this.yaml = yamlToJs(options.yamlPath)

    const stateMachine = {
      Comment: this.yaml.form.header.description,
      name: this.yaml.form.title,
      version: '1.0',
      categories: this.yaml.form.categories,
      instigators: this.yaml.form.instigators,
      StartAt: 'AwaitingHumanInput',
      States: {
        AwaitingHumanInput: {
          Type: 'Task',
          Resource: 'module:awaitingHumanInput',
          ResourceConfig: {
            uiType: 'form',
            uiName: `${options.namespace}_${options.formName}`
          },
          ResultPath: '$.formData',
          Next: 'Upserting'
        },
        Upserting: {
          Type: 'Task',
          InputPath: '$.formData',
          Resource: 'module:upserting',
          ResourceConfig: {
            modelId: options.modelName
          },
          End: true
        }
      },
      restrictions: [
        {
          roleId: '$authenticated',
          allows: [
            '*'
          ]
        }
      ]
    }

    callback(null, stateMachine)
  }
}

module.exports = YamlToStateMachine
