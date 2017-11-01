'use strict'

const _ = require('lodash')
const generateViewStatement = require('./generate-view-statement')
// const generateStats = require('./generate-stats')

class RankingService {
  boot (options, callback) {
    let promises
    // const client = options.bootedServices.storage.client
    const rankings = options.blueprintComponents.rankings
    // let script = ``

    if (_.isObject(rankings)) {
      options.messages.info('Finding rankings')

      // Each property type
      promises = Object.entries(rankings).map(async (i) => {
        // Generate view statement
        const viewStatement = generateViewStatement({
          propertyType: _.snakeCase(i[0].split('_')[1]),
          schema: _.snakeCase(i[0].split('_')[0]),
          source: i[1].source,
          ranking: i[1].factors,
          registry: options.bootedServices.registry.registry[i[0]]
        })

        console.log('---', i[0].split('_')[1], '---')
        console.log(viewStatement + '\n\n')

        // Generate statistics table
        /*
        await generateStats({
          client: client,
          category: i[0].split('_')[1],
          schema: i[0].split('_')[0],
          name: 'test'
        })
        */
      })
    }

    Promise.all(promises)
      .then(() => callback(null))
      .catch((err) => callback(err))

    /* UNCOMMENT THIS WHEN YOU WANT IT TO RUN GENERATE VIEW SCRIPT
    client.query(
      script,
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      }
    )
    */
  }
}

module.exports = {
  serviceClass: RankingService,
  bootAfter: ['registry']
}
