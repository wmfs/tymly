const StorageDao = require('../lib/StorageService-dao')

function DaosToTest () {
  const daos = [ ['built in DAO', null, null] ]

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
    memoryStorageService.boot({ blueprintComponents: {} }, () => {})
    daos.push([
      'memory storage service', null, memoryStorageService
    ])
  } catch (err) {
    console.log('MemoryStorageService not available', err)
  }

  return daos
}

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
