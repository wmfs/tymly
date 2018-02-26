'use strict'

const yaml = require('js-yaml')
const fs = require('fs')

module.exports = function yamlToJs (yamlPath) {
  return yaml.safeLoad(fs.readFileSync(yamlPath, 'utf8'))
}
