'use strict'
const _ = require('lodash')
module.exports = function convertJsonpathToDottie (jsonpath, defaultPath) {
  let dottiePath
  if (_.isString(jsonpath)) {
    dottiePath = jsonpath
    if (dottiePath.length > 0) {
      if (dottiePath[0] === '$') {
        dottiePath = dottiePath.slice(1)
      }
    }
    if (dottiePath.length > 0) {
      if (dottiePath[0] === '.') {
        dottiePath = dottiePath.slice(1)
      }
    }
  }

  if (_.isUndefined(dottiePath) && !_.isUndefined(defaultPath)) {
    dottiePath = defaultPath
  }
  return dottiePath
}
