'use strict'

const _ = require('lodash')
const generateViewStatement = require('./generate-view-statement')

class RankingService {
  boot (options, callback) {
    this.client = options.bootedServices.storage.client

    // let script = ``
    let rankings = options.blueprintComponents.rankings

    if (_.isObject(rankings)) {
      options.messages.info('Finding rankings')
      for (const key in rankings) {
        if (rankings.hasOwnProperty(key)) {
          let schemaName = key.split('_')[0] // e.g. wmfs
          let source = rankings[key].source // e.g. {model: 'gazetteer', property: 'uprn', otherProperties: ['address_label']}
          let propertyType = key.split('_')[1] // e.g. factory OR hospital
          let registry = options.bootedServices.registry.registry[key] // contains ranges for each factor

          let viewStatement = generateViewStatement({
            'propertyType': propertyType,
            'schema': schemaName,
            'source': source,
            'ranking': rankings[key].factors,
            'registry': registry
          })
          // script += viewStatement + ';'

          console.log(propertyType)
          console.log(viewStatement + '\n\n')
        }
      }
    }

    callback(null)
    /* UNCOMMENT THIS WHEN YOU WANT IT TO RUN SCRIPT
    this.executeScript(script, function (err) {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
    */
  }

  executeScript (script, callback) {
    this.client.query(
      script,
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    )
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry']
}

/*
Registry keys can be found in:
options.bootedServices.registry.registry -> registryKeys[key].value (this one appears to look at DB in tymly.registry_key)
or
options.bootedServices.registry.blueprintRegistryKeys -> registryKeys[key].schema.properties.value
*/
