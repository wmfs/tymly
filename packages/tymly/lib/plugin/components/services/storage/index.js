'use strict'

const debug = require('debug')('tymly')
const boom = require('boom')
const _ = require('lodash')
const MemoryModel = require('./Memory-model')
const fs = require('fs')
const split = require('split')
const path = require('path')
const EJSON = require('mongodb-extended-json')

class MemoryStorageService {
  boot (options, callback) {
    const _this = this
    this.storageName = 'memory'
    this.models = {}

    options.messages.info('Using memory storage...')

    this.addModels(options.blueprintComponents.models, options.messages)

    const seedData = options.blueprintComponents.seedData
    if (seedData) {
      options.messages.info('Loading seed data:')
      _.forEach(seedData, (modelSeedData) => {
        const name = modelSeedData.namespace + '_' + modelSeedData.name
        const model = _this.models[name]
        if (model) {
          options.messages.detail(name)
          _.forEach(modelSeedData.data, (row) => {
            // construct document
            const doc = {}
            let documentPropertyNames = modelSeedData.propertyNames

            for (let i = 0, colCount = documentPropertyNames.length; i < colCount; i++) {
              doc[_.snakeCase(documentPropertyNames[i])] = row[i]
            }

            // persist document
            debug('persisting document', doc)
            model.upsert(doc, {}, () => {}) // In-memory is sync really (so this is OK)
          })
        } else {
          options.messages.detail(`WARNING: seed data found for model ${name}, but no such model was found`)
        }
      })
    }

    callback(null)
  } // boot

  addModels (modelDefinitions, messages) {
    if (!modelDefinitions) {
      return
    } // if (!modelDefinitions

    for (const [name, definition] of Object.entries(modelDefinitions)) {
      this.addModel(name, definition, messages)
    } // for ...
  } // addModels

  addModel (name, definition, messages) {
    if (!name || !definition) {
      return
    } // if ...

    if (this.models[name]) {
      detailMessage(messages, `${name} already defined in MemoryStorage`)
    } // if ...

    detailMessage(messages, `Added ${name} to MemoryStorage`)
    this.models[name] = new MemoryModel(definition)
  } // addModel

  fileImporter (action, modelId, rootDir, fileInfo, importReport, callback) {
    const model = this.models[modelId]
    const primaryKey = this.models[modelId].primaryKey

    if (model) {
      const filePath = path.resolve(rootDir, fileInfo.filePath)

      const readStream = fs.createReadStream(filePath)
      readStream.pipe(split())

        // For each line
        // -------------
        .on('data', function (line) {
          if (line[0] === '{') {
            const data = EJSON.parse(line)
            switch (action) {
              case 'upsert':

                const where = {}
                primaryKey.forEach(
                function (key) {
                  where[key] = data[key]
                }
              )

                model.upsert(data, {}, function () {}) // In-memory is sync really (so this is OK)

                break
            }
          }
        })
        .on('end', function () {
          callback(null)
        })
    } else {
      callback(boom.notFound('Unable to import file - unknown modelId ' + modelId, modelId))
    }
  }
}

function detailMessage (messages, msg) {
  if (!messages) {
    return
  }

  messages.detail(msg)
} // detailMessage

module.exports = {
  serviceClass: MemoryStorageService,
  refProperties: {
    modelId: 'models'
  },
  bootAfter: ['caches']
}
