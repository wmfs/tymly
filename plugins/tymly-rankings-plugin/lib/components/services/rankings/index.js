'use strict'

const _ = require('lodash')
const generateViewStatement = require('./generate-view-statement')
const generateStats = require('./generate-stats')

class RankingService {
  boot (options, callback) {
    const client = options.bootedServices.storage.client
    const rankings = options.blueprintComponents.rankings

    if (_.isObject(rankings)) {
      let promises
      options.messages.info('Finding rankings')

      promises = Object.keys(rankings).map(async (key) => {
        const value = rankings[key]

        console.log('---', key)

        if (value.source && value.factors) {
          // Generate view statement
          const viewStatement = generateViewStatement({
            category: _.snakeCase(value.name),
            schema: _.snakeCase(value.namespace),
            source: value.source,
            ranking: value.factors,
            registry: options.bootedServices.registry.registry[key]
          })

          // Execute the viewStatement
          await client.query(viewStatement)

          // Generate statistics table
          // TODO: name should be inferred and not be 'test'
          await generateStats({
            client: client,
            category: value.name,
            schema: value.namespace,
            name: 'test'
          })
        }
      })

      Promise.all(promises)
        .then(() => callback(null))
        .catch((err) => callback(err))
    }
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry']
}
