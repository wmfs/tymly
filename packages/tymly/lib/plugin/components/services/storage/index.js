'use strict'

const debug = require('debug')('tymly')
const boom = require('boom')
// const _ = require('lodash')
const MemoryModel = require('./Memory-model')
const fs = require('fs')
const split = require('split')
const path = require('path')
const EJSON = require('mongodb-extended-json')

class MemoryStorageService {
  boot (options, callback) {
    this.storageName = 'memory'
    this.models = {}

    infoMessage(options.messages, 'Using MemoryStorage...')

    this._createModels(options.blueprintComponents.models, options.messages)

    this._insertMultipleSeedData(options.blueprintComponents.seedData, options.messages)

    callback(null)
  } // boot

  _createModels (modelDefinitions, messages) {
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
      return this.models[name]
    } // if ...

    detailMessage(messages, `Adding ${name} to MemoryStorage`)
    this.models[name] = new MemoryModel(definition)
    return this.models[name]
  } // addModel

  _insertMultipleSeedData (seedDataArray, messages) {
    if (!seedDataArray) {
      return
    }
    infoMessage(messages, 'Loading seed data:')

    for (const seedData of Object.values(seedDataArray)) {
      this._insertSeedData(seedData, messages)
    }
  } // insertMultipleSeedData

  _insertSeedData (seedData, messages) {
    const name = `${seedData.namespace}_${seedData.name}`
    const model = this.models[name]
    if (!model) {
      return detailMessage(messages, `WARNING: seed data found for model ${name}, but no such model was found`)
    }

    detailMessage(messages, name)
    for (const row of seedData.data) {
      // construct document
      const doc = {}
      for (const [index, name] of seedData.propertyNames.entries()) {
        // doc[_.snakeCase(name)] = row[index]
        doc[name] = row[index]
      }

      console.log(doc.user_id)
      // persist document
      debug('persisting document', doc)
      model.upsert(doc, {}, () => {}) // In-memory is sync really (so this is OK)
    }
  } // insertSeedData

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

function infoMessage (messages, msg) {
  if (!messages) {
    return
  }

  messages.info(msg)
} // infoMessage

module.exports = {
  serviceClass: MemoryStorageService,
  refProperties: {
    modelId: 'models'
  },
  bootAfter: ['caches']
}
