'use strict'

const path = require('path')
const _ = require('lodash')
const fs = require('fs')

module.exports = function generateEditorFlow (filepath, blueprintPath) {
  let formName = path.basename(blueprintPath, '-blueprint') + '-form'
  let camelCaseFormName = _.camelCase(formName)
  let modelName = path.basename(filepath, '.json')
  let camelCaseModelName = _.camelCase(modelName.replace(/-/g, ' '))
  let formattedModelName = _.startCase(_.camelCase(modelName.replace(/-/g, ' ')))
  let flow = {
    label: formattedModelName + ' Editor',
    description: 'Auto-generated form for editing \'' + formattedModelName + '\' data.',
    version: '1.0',
    tags: 'autoGenerated',
    instigators: ['user'],
    initialStateId: 'findingById',
    initialCtx: {},
    fsm: {
      findingById: {
        options: {
          modelId: camelCaseModelName,
          target: 'formData',
          key: {
            $value: {
              path: 'key'
            }
          }
        },
        events: {
          next: {
            to: 'formFilling'
          }
        }
      },
      formFilling: {
        options: {
          formId: camelCaseFormName,
          target: 'formData'
        },
        events: {
          submit: {
            to: 'upserting'
          }
        }
      },
      upserting: {
        options: {
          modelId: camelCaseModelName,
          doc: {
            $value: {
              path: 'formData'
            }
          }
        }
      }
    }
  }

  // Create JSON file, in /flows directory name _-editor.json
  fs.writeFileSync(path.join(filepath, '../../flows', modelName + '-editor.json'), JSON.stringify(flow, null, 2))
}
