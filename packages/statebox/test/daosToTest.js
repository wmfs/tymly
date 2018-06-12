const StorageDao = require('../lib/dao/StorageService-dao')

let messages = null
try {
  messages = require('../../tymly/lib/startup-messages/index')()
} catch (err) {
  console.log('Startup messages not available')
}

function DaosToTest () {
  const daos = [ ['built in DAO', null, null] ]

  // Memory Storage?
  try {
    const MemoryModel = require('../../tymly/lib/plugin/components/services/storage/Memory-model')
    const model = new MemoryModel(StorageDao.ExecutionModelDefinition)
    daos.push([
      'in-memory storage dao', new StorageDao(model), null
    ])
  } catch (err) {
    console.log('MemoryModel not available')
  }
  try {
    const MemoryStorageServiceClass = require('../../tymly/lib/plugin/components/services/storage/index').serviceClass
    const memoryStorageService = new MemoryStorageServiceClass()
    memoryStorageService.boot({ blueprintComponents: {}, messages: messages }, () => {})
    daos.push([
      'memory storage service', null, memoryStorageService
    ])
  } catch (err) {
    console.log('MemoryStorageService not available')
  }

  return daos
}

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error)
})

module.exports = DaosToTest().map(([name, dao, storageService]) => {
  return [name, {
    dao: dao,
    bootedServices: {
      storage: storageService
    }
  }
  ]
}
)
