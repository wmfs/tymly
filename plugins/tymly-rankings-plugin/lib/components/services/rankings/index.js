'use strict'

const _ = require('lodash')
const async = require('async')
const generateViewStatement = require('./generate-view-statement')
const generateStats = require('./generate-stats')

class RankingService {
  boot (options, callback) {
    this.viewSQL = {}
    const client = options.bootedServices.storage.client
    const rankings = options.blueprintComponents.rankings

    if (!_.isObject(rankings)) {
      options.messages.info('No rankings to find')
      return callback(null)
    }

    options.messages.info('Finding rankings')

    const rankingKeysWithValuesAndRegistry = Object.keys(rankings).filter(key => {
      const value = rankings[key]
      if (value.source && value.factors && options.bootedServices.registry.registry[key]) {
        return key
      }
    })

    async.each(rankingKeysWithValuesAndRegistry, (key, cb) => {
      const value = rankings[key]
      const rankingModel = options.bootedServices.storage.models[`${_.camelCase(value.namespace)}_${value.rankingModel}`]
      const statsModel = options.bootedServices.storage.models[`${_.camelCase(value.namespace)}_${value.statsModel}`]

      this.viewSQL[key] = generateViewStatement({
        category: _.snakeCase(value.name),
        schema: _.snakeCase(value.namespace),
        source: value.source,
        ranking: value.factors,
        registry: options.bootedServices.registry.registry[key]
      })

      client.query(
        this.viewSQL[key],
        (err) => {
          if (err) cb(err)
          generateStats({
            client: client,
            category: value.name,
            schema: value.namespace,
            pk: value.source.property,
            name: value.namespace,
            rankingModel: rankingModel,
            statsModel: statsModel,
            registry: options.bootedServices.registry.registry[key]
          }, (err) => {
            if (err) cb(err)
            cb()
          })
        }
      )
    }, (err) => {
      if (err) callback(err)
      callback(null)
    })
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry', 'storage']
}
