'use strict'

const shasum = require('shasum')

class FormsService {
  boot (options, callback) {
    this.forms = {}

    const formDefinitions = options.blueprintComponents.forms || {}
    let formDefinition

    for (let formId in formDefinitions) {
      if (formDefinitions.hasOwnProperty(formId)) {
        options.messages.info(formId)
        formDefinition = formDefinitions[formId]
        formDefinition.shasum = shasum(formDefinition)
        this.forms[formId] = formDefinition
      }
    }

    callback(null)
  }
}

module.exports = {
  serviceClass: FormsService,
  refProperties: {
    formId: 'forms'
  },
  bootBefore: ['tymly', 'rbac']
}
