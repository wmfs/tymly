const StorageDao = require('../lib/StorageService-dao')

function DaosToTest () {
  const daos = [ ['built in DAO', null] ]

  try {
    const MemoryModel = require('../../tymly/lib/plugin/components/services/storage/Memory-model')
    const model = new MemoryModel(StorageDao.ExecutionModelDefinition)
    daos.push([
      'in-memory storage service', new StorageDao(model)
    ])
  } catch (err) {
    console.log('MemoryModel not available')
  }

  return daos
}

module.exports = DaosToTest
