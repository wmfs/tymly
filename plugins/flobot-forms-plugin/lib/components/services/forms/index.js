'use strict'

// var dottie = require ('dottie');
// var mongoose = require ('mongoose');
// var transformSchemaDefinition = require ('mongoose-gen');
// var _ = require ('lodash');

class FormsService {

  boot (options, callback) {
    this.forms = {}

    const formDefinitions = options.blueprintComponents.forms || {};
    let formDefinition;

    for (let formId in formDefinitions) {
      if (formDefinitions.hasOwnProperty(formId)) {
        options.messages.info(formId)
        formDefinition = formDefinitions[formId]
        this.forms[formId] = formDefinition
      }
    }

    callback(null)
  }

}

module.exports = {
  serviceClass: FormsService,

  configModifier: function flobotsServiceConfigModifier (ctx) {
    if (ctx.utils.isFsmOptions(ctx)) {
      ctx.utils.idNamespacer('formId', 'forms', ctx)
    }
  },

  bootBefore: ['flobots', 'rbac']
}

