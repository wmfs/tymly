'use strict'

const _ = require('lodash')
const async = require('async')
const generateViewStatement = require('./generate-view-statement')
const generateStats = require('./generate-stats')
const debug = require('debug')('tymly-rankings-plugin')

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

      const factors =
        Object.keys(value.factors)
          .filter(factor => Object.keys(options.bootedServices.registry.registry[key].value).includes(factor))
          .reduce((obj, key) => {
            obj[key] = value.factors[key]
            return obj
          }, {})

      this.viewSQL[key] = generateViewStatement({
        category: _.snakeCase(value.name),
        schema: _.snakeCase(value.namespace),
        source: value.source,
        ranking: factors,
        registry: options.bootedServices.registry.registry[key]
      })

      debug(key + ' SQL:')
      debug(this.viewSQL[key])

      client.query(
        this.viewSQL[key],
        (err) => {
          if (err) return cb(err)
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
            cb(err)
          })
        }
      )
    }, (err) => {
      callback(err)
    })
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry', 'storage']
}
