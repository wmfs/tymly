'use strict'

module.exports = {
  description: 'Replaces the default in-memory storage solution with a MongoDB-backed alternative',
  example: require('./example.json'),
  blueprintDirs: {
    models: "One JSON file per model (contents to be a JSON schema for defining the model's data structure)"
  }
}
