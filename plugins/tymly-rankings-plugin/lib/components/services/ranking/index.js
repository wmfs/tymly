'use strict'

const _ = require('lodash')
const generateViewStatement = require('./generate-view-statement')

class RankingService {
  boot (options, callback) {
    let rankings = options.blueprintComponents.rankings

    if (_.isObject(rankings)) {
      options.messages.info('Finding rankings')
      for (const key in rankings) {
        if (rankings.hasOwnProperty(key)) {
          let schemaName = key.split('_')[0] // wmfs
          let tableToMatchOn = rankings[key].model // gazetteer
          let columnToMatchOn = rankings[key].id // uprn
          let propertyType = key.split('_')[1] // factory OR hospital
          let joinParts = new Set()
          let registry = options.bootedServices.registry.registry[key]

          let viewStatement = generateViewStatement(schemaName, tableToMatchOn, propertyType, columnToMatchOn, rankings[key].factors, registry, joinParts)

          console.log(viewStatement + '\n\n')
        }
      }
    }

    /*
    Registry keys can be found in:
    options.bootedServices.registry.registry -> registryKeys[key].value (this one appears to look at DB in fbot.registry_key)
    or
    options.bootedServices.registry.blueprintRegistryKeys -> registryKeys[key].schema.properties.value
    */

    callback(null)
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry']
}
