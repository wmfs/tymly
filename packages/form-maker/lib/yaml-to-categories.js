'use strict'

const yamlToJs = require('./utils/yaml-to-js')
const _ = require('lodash')

class YamlToCategories {
  generateCategories (options, callback) {
    this.yaml = yamlToJs(options.yamlPath)

    const categories = this.yaml.form.categories.map(category => {
      return {
        label: _.startCase(category),
        description: _.startCase(category),
        style: {
          icon: category,
          backgroundColor: '#FFFFFF'
        }
      }
    })

    callback(null, categories)
  }
}

module.exports = YamlToCategories
