'use strict'

const jp = require('jsonpath')
const _ = require('lodash')

class InputValueCache {
  constructor () {
    this.cache = {}
  }

  get (inputPath, values) {
    if (this.cache.hasOwnProperty(inputPath)) {
      return this.cache[inputPath]
    } else {
      let value = jp.query(values, inputPath)

      if (_.isArray(value)) {
        let l = value.length
        switch (l) {
          case 0:
            value = undefined
            break
          case 1:
            value = value[0]
            break
        }
      }
      this.cache[inputPath] = value
      return value
    }
  }
}

module.exports = InputValueCache
