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

      let rankingKeysWithValues = Object.keys(rankings).filter(key => {
        const value = rankings[key]
        if (value.source && value.factors) {
          return key
        }
      })

      promises = rankingKeysWithValues.map(async (key) => {
        const value = rankings[key]

        await client.query(generateViewStatement({
          category: _.snakeCase(value.name),
          schema: _.snakeCase(value.namespace),
          source: value.source,
          ranking: value.factors,
          registry: options.bootedServices.registry.registry[key]
        }))

        // TODO: name should be inferred and not be 'test'
        await generateStats({
          client: client,
          category: value.name,
          schema: value.namespace,
          pk: value.source.property,
          name: 'test'
        })
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
